///////////////////////////////////////////////////////////////////////////
// measurementfilter.js
//
// CAN to VSCP conversion node
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

"use strict";

const vscp = require('node-vscp');

// Debug:
// https://nodejs.org/api/util.html
// export NODE_DEBUG=vscpfilter  for all debug events
const util = require('util');
const debuglog = util.debuglog('m-filter');

module.exports = function(RED) {

    function measurementFilterNode(config) {

        RED.nodes.createNode(this,config);
        var node = this;

        this.unit = config.unit.trim();
        this.sensorindex = config.sensorindex.trim();
        this.index = config.index.trim();
        this.zone = config.zone.trim();
        this.subzone = config.subzone.trim();

        debuglog("unit '" + this.unit + "' " +  typeof this.priority );
        debuglog("sensorindex" + this.sensorindex + "' " +  typeof this.vscpclass );
        debuglog("index" + this.index + "' " +  typeof this.vscptype );
        debuglog("zone" + this.zone + "' " +  typeof this.zone );
        debuglog("subzone" + this.subzone + "' " +  typeof this.subzone );

        node.on('input', function(msg, send, done) {

            debuglog("Payload = " + JSON.stringify(msg.payload) );

            // object
            if ( typeof msg.measurement === 'object' ) {

                debuglog("Message format = object");

                // If this is pre-1.0, 'send' will be undefined, so fallback to node.send
                send = send || function() {
                    node.send.apply(node, arguments)
                }

                // unit
                if (this.unit.length) {
                    
                    let _unit = vscp.readValue(this.unit);
                    debuglog("unit: "+ _unit + 
                             " Event: " + msg.measurement.unit );
                    if (_unit != msg.measurement.unit) {
                        debuglog("Filtered out on unit");
                        done();
                        return;
                    }

                }

                // sensorindex
                if (this.sensorindex.length) {
                    
                    let _sensorindex = vscp.readValue(this.sensorindex);
                    debuglog("sensorindex: "+ _sensorindex + 
                             " Event: " + msg.measurement.sensorindex );
                    if (_sensorindex != msg.measurement.sensorindex) {
                        debuglog("Filtered out on sensorindex");
                        done();
                        return;
                    }

                }

                // index
                if (this.index.length) {
                    
                    let _index = vscp.readValue(this.index);
                    debuglog("index: "+ _index + 
                             " Event: " + msg.measurement.index );
                    if (_index != msg.measurement.index) {
                        debuglog("Filtered out on index");
                        done();
                        return;
                    }

                }

                // zone
                if (this.zone.length) {
                    
                    let _zone = vscp.readValue(this.zone);
                    debuglog("zone: "+ _zone + 
                             " Event: " + msg.measurement.zone );
                    if (_zone != msg.measurement.zone) {
                        debuglog("Filtered out on zone");
                        done();
                        return;
                    }

                }

                // subzone
                if (this.subzone.length) {
                    
                    let _subzone = vscp.readValue(this.subzone);
                    debuglog("subzone: "+ _subzone + 
                             " Event: " + msg.measurement.subzone );
                    if (_subzone != msg.measurement.subzone) {
                        debuglog("Filtered out on subzone");
                        done();
                        return;
                    }

                }
                
                send(msg);
                done();

            }
            // Invalid format
            else {
                node.error("msg.measurement is not present (use event2value before this ndoe)", msg);
            }

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
    RED.nodes.registerType("m-filter",measurementFilterNode);
}

