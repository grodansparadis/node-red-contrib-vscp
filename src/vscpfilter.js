///////////////////////////////////////////////////////////////////////////
// vscpfilter.js
//
// CAN to VSCP conversion node
//
// This file is part of the VSCP (https://www.vscp.org)
//
// The MIT License (MIT)
//
// Copyright © 2020-2021 Ake Hedman, Grodans Paradis AB
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
const debuglog = util.debuglog('vscpfilter');

module.exports = function(RED) {

    function vscpFilterNode(config) {

        RED.nodes.createNode(this,config);
        var node = this;

        this.name = config.name;
        this.priority = config.vscppriority.trim();
        this.vscpclass = config.vscpclass.trim();
        this.vscptype = config.vscptype.trim();
        this.guid = config.vscpguid.trim();

        debuglog("Filter Priority '" + this.priority + "' " +  typeof this.priority );
        debuglog("Filter VSCP Class" + this.vscpclass + "' " +  typeof this.vscpclass );
        debuglog("Filter VSCP Type" + this.vscptype + "' " +  typeof this.vscptype );
        debuglog("Filter GUID" + this.guid + "' " +  typeof this.guid );

        // {
        //    priority : 0,
        //    vscpclass : 1,
        //    vscptype : 1,
        //    guid : "00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00"    
        // }
        node.on('input', function(msg, send, done) {

            debuglog("Payload = " + JSON.stringify(msg.payload) );

            // object
            if ( typeof msg.payload === 'object' ) {

                debuglog("Message format = object");

                // If this is pre-1.0, 'send' will be undefined, so fallback to node.send
                send = send || function() {
                    node.send.apply(node, arguments)
                }

                // Priority
                if (this.priority.length) {
                    
                    let priority = vscp.readValue(this.priority);
                    debuglog("Priority: "+ priority + 
                             " Event: " + vscp.getPriority(msg.payload.vscpHead) +
                             " - " + msg.payload.vscpHead );
                    if (priority < vscp.getPriority(msg.payload.vscpHead)) {
                        debuglog("Filtered out on priority");
                        done();
                        return;
                    }

                }

                // VSCP Class
                if (this.vscpclass.length) {
                    
                    let vscpclass = vscp.readValue(this.vscpclass);
                    debuglog("VSCP Class: "+ vscpclass + 
                             " Event: " + msg.payload.vscpClass );
                    if (vscpclass != msg.payload.vscpClass) {
                        debuglog("Filtered out on VSCP Class");
                        done();
                        return;
                    }

                }

                // VSCP Type
                if (this.vscptype.length) {
                    
                    let vscptype = vscp.readValue(this.vscptype);
                    debuglog("VSCP Type: "+ vscptype + 
                             " Event: " + msg.payload.vscpType );
                    if (vscptype != msg.payload.vscpType) {
                        debuglog("Filtered out on VSCP Type");
                        done();
                        return;
                    }

                }

                // VSCP GUID
                if (this.guid.length) {
                    debuglog("VSCP GUID: "+ this.guid + 
                             " Event: " + msg.payload.vscpGuid );
                    if ( 0 != msg.payload.vscpGuid.toUpperCase().indexOf(this.guid.toUpperCase()) ) {
                        debuglog("Filtered out on VSCP GUID");
                        done();
                        return;
                    }
                }
        
                send(msg);
                done();

            }
            // Invalid format
            else {
                node.error("Payload has invalid format (should be VSCP event object or string)", msg);
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
    RED.nodes.registerType("vscpfilter",vscpFilterNode);
}

