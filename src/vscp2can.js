///////////////////////////////////////////////////////////////////////////
// vscp2can.js
//
// VSCP to CAN conversion node.
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
// export NODE_DEBUG=vscp2can  for all debug events
const util = require('util');
const debuglog = util.debuglog('vscp2can');

module.exports = function(RED) {
    
    function vscpToCanNode(config) {
    
        RED.nodes.createNode(this, config);
        var node = this;
    
        // Convert VSCP event to CAN message
        node.on('input', function(msg, send, done) {

            var ev = null;
            debuglog(msg.payload);

            // OK with string form
            if ( typeof msg.payload === 'string' ) { 
                debuglog("String input: ", msg.payload);               
                ev = new vscp.Event();
                ev.setFromString(msg.payload);
                debuglog("Event object: ", ev);
                msg.payload = vscp.convertEventToCanMsg(ev);
                debuglog("msg.payload",msg.payload);
            }
            else if (msg.payload instanceof vscp.Event ) {
                debuglog("Event");
                msg.payload = vscp.convertEventToCanMsg(msg.payload);
            }
            else {
                debuglog("JSON object",msg.payload);
                ev = new vscp.Event(msg.payload);
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
    RED.nodes.registerType('vscp2can', vscpToCanNode);
} 