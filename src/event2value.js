///////////////////////////////////////////////////////////////////////////
// event2value.js
//
// VSCP measurement event to value.
//
// This file is part of the VSCP (https://www.vscp.org)
//
// The MIT License (MIT)
//
// Copyright © 2020 Ake Hedman, Grodans Paradis AB
// <info@grodansparadis.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//

//"use strict";
    
const vscp = require('node-vscp');
const vscpclass = require('node-vscp-class');

// Debug:
// https://nodejs.org/api/util.html
// export NODE_DEBUG=event2value  for all debug events
const util = require('util');
const debuglog = util.debuglog('event2value');

module.exports = function(RED) {
    
    function eventToValueNode(config) {

        // https://stackoverflow.com/questions/24524578/reading-c-float-value-from-buffer-in-javascript
        function f32bit_double(x) {
            // handle sign bit
            if (x < 0) {
                x += 2147483648;
                s = -1;
            } else {
                s = 1;
            }
        
            r = x % 8388608; // raw significand
            e = (x-r) >> 23; // raw exponent
        
            if (e === 0) {
                // subnormal
                e -= 126;
                r = r/8388608;
            } else if (e == 255) {
                // inf or nan
                return r === 0 ? s*Infinity : NaN;
            } else {
                // normalised
                e -= 127;
                r = 1+r/8388608;
            }
            return s*r*Math.pow(2,e);
        }

        longToByteArray = function(/*long*/long) {
            // we want to represent the input as a 8-bytes array
            var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];
        
            for ( var index = 0; index < byteArray.length; index ++ ) {
                var byte = long & 0xff;
                byteArray [ index ] = byte;
                long = (long - byte) / 256 ;
            }
        
            return byteArray;
        };
        
        byteArrayToLong = function(/*byte[]*/byteArray) {
            var value = 0;
            for ( var i = byteArray.length - 1; i >= 0; i--) {
                value = (value * 256) + byteArray[i];
            }
        
            return value;
        };
    
        RED.nodes.createNode(this, config);
        var node = this;
    
        // Convert VSCP measurement event to value
        node.on('input', function(msg, send, done) {

            debuglog(msg.payload);

            // OK with string form
            if ( typeof msg.payload === 'string' ) { 
                debuglog("String input: ", msg.payload);               
                var ev = new vscp.Event();
                ev.setFromString(msg.payload);
                debuglog("Event object: ", ev);
                msg.event = ev.toJSONObj();
                msg.payload = NaN;  // Be pessimistic
                if ( vscp.isMeasurement(ev.vscpClass) ) {
                    // CLASS1.MEASUREMENT
                    if ( (10 == ev.vscpClass) ||
                         (11 == ev.vscpClass) || 
                         (12 == ev.vscpClass) ||
                         (13 == ev.vscpClass) ||
                         (14 == ev.vscpClass) ) {
                        msg.payload = decodeClass10(ev.vscpData);
                    }
                    // CLASS1.MEASUREMENT64
                    else if ( (60 == ev.vscpClass) ||
                              (61 == ev.vscpClass) ||
                              (62 == ev.vscpClass) ||
                              (63 == ev.vscpClass) ||
                              (64 == ev.vscpClass) ) {
                        msg.payload = decodeClass60(ev.vscpData);
                    }
                    // CLASS1.MEASUREZONE
                    else if ( (65 == ev.vscpClass) ||
                              (66 == ev.vscpClass) ||
                              (67 == ev.vscpClass) ||
                              (68 == ev.vscpClass) ||
                              (69 == ev.vscpClass) ) {
                        msg.payload = decodeClass65(ev.vscpData);
                    }
                    // CLASS1.MEASUREMENT32
                    else if ( (70 == ev.vscpClass) ||
                              (71 == ev.vscpClass) ||
                              (72 == ev.vscpClass) ||
                              (73 == ev.vscpClass) ||
                              (74 == ev.vscpClass) ) {
                        msg.payload = decodeClass60(ev.vscpData);
                    }
                    // CLASS1.SETVALUEZONE
                    else if ( (85 == ev.vscpClass) ||
                              (86 == ev.vscpClass) ||
                              (87 == ev.vscpClass) ||
                              (88 == ev.vscpClass) ||
                              (89 == ev.vscpClass) ) {
                        msg.payload = decodeClass60(ev.vscpData);
                    }
                    // CLASS2.MEASUREMENT_STR
                    else if ( 1040 == ev.vscpClass ) {
                        var tempArray = ev.vscpData.map((x) => {return String.fromCharCode(x);});
                        msg.payload = parseFloat(tempArray.join(''));
                    }
                    // CLASS2.MEASUREMENT_FLOAT
                    else if ( 1060 == ev.vscpClass ) {
                        var float64 = f32bit_double(ev.vscpData);
                    }
                }
                debuglog("msg.payload",msg.payload);
            }
            else if (msg.payload instanceof vscp.Event ) {
                debuglog("Event");
                msg.payload = vscp.convertEventToCanMsg(msg.payload);
            }
            else {
                debuglog("JSON object",msg.payload);
                var ev = new vscp.Event(msg.payload);
                debuglog(ev);
                msg.payload = vscp.convertEventToCanMsg(ev);
                debuglog(msg.payload);
            }

            // If this is pre-1.0, 'send' will be undefined, so fallback to node.send
            send = send || function() {
                node.send.apply(node, arguments)
            }
            
            send(msg);
            done();
        });
    
        this.on('close', function(removed, done) {

            if (removed) {
                // This node has been deleted
            } else {
                // This node is being restarted
            }

            done();

        });
    }
    RED.nodes.registerType('event2value', eventToValueNode);
} 