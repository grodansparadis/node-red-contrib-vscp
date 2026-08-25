///////////////////////////////////////////////////////////////////////////
// vscpfilter.js
//
// CAN to VSCP conversion node
//
// This file is part of the VSCP (https://www.vscp.org)
//
// The MIT License (MIT)
//
// Copyright © 2020-2026 Ake Hedman, Grodans Paradis AB
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

        this.filter = RED.nodes.getNode(config.filterConfig || config.filter);
        this.name = config.name;
        this.priority = (config.priority || '').trim();
        this.vscpclass = (config.vscpclass || config.class || '').trim();
        this.vscptype = (config.vscptype || config.type || '').trim();
        this.guid = (config.guid || '').trim();

        if (this.filter) {
            if (!this.priority.length) {
                this.priority = String(this.filter.filterPriority || '').trim();
            }
            if (!this.vscpclass.length) {
                this.vscpclass = String(this.filter.filterClass || '').trim();
            }
            if (!this.vscptype.length) {
                this.vscptype = String(this.filter.filterType || '').trim();
            }
            if (!this.guid.length) {
                this.guid = String(this.filter.filterGuid || '').trim();
            }
        }

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

            // object/string
            if ((typeof msg.payload === 'object') || (typeof msg.payload === 'string')) {

                debuglog("Message format = " + typeof msg.payload);

                let ev = null;
                try {
                    ev = new vscp.Event(msg.payload);
                }
                catch (err) {
                    node.error("Payload has invalid VSCP event format", msg);
                    done();
                    return;
                }

                debuglog(
                    "Parsed event from " +
                    typeof msg.payload +
                    " payload: head=" +
                    ev.head +
                    " class=" +
                    ev.vscpclass +
                    " type=" +
                    ev.vscptype +
                    " guid=" +
                    (ev.guid || ''),
                );

                // If this is pre-1.0, 'send' will be undefined, so fallback to node.send
                send = send || function() {
                    node.send.apply(node, arguments)
                }

                // Priority
                if (this.priority.length) {
                    
                    let priority = vscp.readValue(this.priority);
                    debuglog("Priority: "+ priority + 
                             " Event: " + vscp.getPriority(ev.head) +
                             " - " + ev.head );
                    if (priority < vscp.getPriority(ev.head)) {
                        debuglog("Filtered out on priority");
                        done();
                        return;
                    }

                }

                // VSCP Class
                if (this.vscpclass.length) {
                    
                    let eventClass = vscp.readValue(this.vscpclass);
                    debuglog(
                      "VSCP Class: " +
                        eventClass +
                        " Event: " +
                                                ev.vscpclass,
                    );
                                        if (eventClass != ev.vscpclass) {
                        debuglog("Filtered out on VSCP Class");
                        done();
                        return;
                    }

                }

                // VSCP Type
                if (this.vscptype.length) {
                    
                    let eventType = vscp.readValue(this.vscptype);
                    debuglog("VSCP Type: "+ eventType + 
                             " Event: " + ev.vscptype );
                    if (eventType != ev.vscptype) {
                        debuglog("Filtered out on VSCP Type");
                        done();
                        return;
                    }

                }

                // VSCP GUID
                if (this.guid.length) {
                    const eventGuid = (ev.guid || '').toUpperCase();
                    const filterGuid = this.guid.toUpperCase();
                    debuglog("VSCP GUID: "+ this.guid + 
                             " Event: " + eventGuid );
                    if (0 != eventGuid.indexOf(filterGuid)) {
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
                node.error("Payload has invalid format (should be VSCP event object or VSCP event string)", msg);
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

