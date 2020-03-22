///////////////////////////////////////////////////////////////////////////
// can2vscp.js
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
// export NODE_DEBUG=can2vscp  for all debug events
const util = require('util');
const debuglog = util.debuglog('can2vscp');

module.exports = function(RED) {

    function canToVscpNode(config) {

        RED.nodes.createNode(this,config);
        var node = this;

        node.on('input', function(msg, send, done) {

            var frame = {};
            debuglog(msg.payload);

            // OK with string form
            if ( typeof msg.payload === 'string' ) {

                debuglog("Message format = string");

                // <can_id>#{R|data}
                // for CAN 2.0 frames
                // 
                // <can_id>##<flags>{data}
                // for CAN FD frames
                if( msg.payload && 
                    (msg.payload.indexOf("##") != -1 ) ) {   // CAN FD frame
                    
                    debuglog("FD Frame");

                    frame = {};

                    frame.canid  = parseInt(msg.payload.split("##")[0],16);
                    debuglog("frame.id " + frame.id);
                    let data     = msg.payload.split("##")[1];
                    debuglog("data " + data);
                    frame.data   = Buffer.from(data,"hex");
                    frame.dlc    = frame.data.length;
                    if ( frame.dlc > 64 ) {

                        if (done) {
                            // Node-RED 1.0 compatible
                            done("Invalid CAN FD frame length " + frame.dlc);
                        } else {
                            // Node-RED 0.x compatible
                            node.error("Invalid CAN FD frame length " + frame.dlc, msg);
                        }
                    
                    }		
                    
                    msg.payload = vscp.convertCanMsgToEvent(frame);

                    // If this is pre-1.0, 'send' will be undefined, so fallback to node.send
                    send = send || function() {
                        node.send.apply(node, arguments)
                    }
            
                    send(msg);
                    done();
                }
                else if( msg.payload && 
                    (msg.payload.indexOf("#") != -1 ) ) {

                    debuglog("CAN Frame");

                    frame = {};

                    let id = msg.payload.split("#")[0];
                    frame.canid  = parseInt(id,16);
                    frame.ext = true;
                    let data  = msg.payload.split("#")[1];
                    debuglog("R check",typeof data,data.indexOf("R"));
                    if ( -1 == data.indexOf("R") ) {
                        debuglog( "CAN: ",frame.id,data);                        
                        var buffer   = Buffer.from(data,"hex");
                        frame.dlc    = buffer.length;
                        frame.data = buffer;
                        //frame.data = Array.prototype.slice.call(buffer, 0);
                        debuglog(frame.data);
                        if ( frame.dlc > 8 ) {
                            if (done) {
                                // Node-RED 1.0 compatible
                                done("Invalid CAN frame length " + frame.dlc);
                            } else {
                                // Node-RED 0.x compatible
                                node.error("Invalid CAN frame length " + frame.dlc, msg.payload);
                            }	
                        }
                        debuglog(frame);
                    }
                    else {
                        // Remote transmission request
                        debuglog("Remote transmission request");
                        frame.dlc  = 0;
                        frame.data = null;                        
                    }

                    debuglog("convertCanMsgToEvent :",frame)    
                    msg.payload = vscp.convertCanMsgToEvent(frame);

                    // If this is pre-1.0, 'send' will be undefined, so fallback to node.send
                    // send = send || function() {
                    //     node.send.apply(node, arguments)
                    // }
        
                    // send(msg);
                    // done();
                }
                else {

                    if (done) {
                        // Node-RED 1.0 compatible
                        done("Invalid CAN frame");
                    } else {
                        // Node-RED 0.x compatible
                        node.error("Invalid CAN frame", msg);
                    }
                    
                }

            }
            else if ( typeof msg.payload === 'object' ) {
                msg.payload = vscp.convertCanMsgToEvent(msg.payload);
            }
            // Invalid format
            else {
                node.error("Payload has invalid format (should be canmsg object or string)", msg);
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
    RED.nodes.registerType("can2vscp",canToVscpNode);
}

