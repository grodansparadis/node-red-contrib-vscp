///////////////////////////////////////////////////////////////////////////
// event2value.js
//
// VSCP measurement event to value.
//
// This file is part of the VSCP (https://www.vscp.org)
//
// The MIT License (MIT)
//
// Copyright © 2020-2024 Ake Hedman, Grodans Paradis AB
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
const vscpclass = require('node-vscp-class');

// Debug:
// https://nodejs.org/api/util.html
// export NODE_DEBUG=event2value  for all debug events
const util = require('util');
const debuglog = util.debuglog('event2value');

module.exports = function(RED) {
    
    function eventToValueNode(config) {

        RED.nodes.createNode(this, config);

        this.bTransparent = config.btransparent;      // All events sent
        this.bToPayLoad = config.btopayload;          // Measurement to payload
        this.bValue2Payload = config.bvalue2payload;  // Payload is measurement value

        var node = this;

        // bTransparent have no meaning if bValue2Payload
        // is set to true
        if (this.bValue2Payload && this.bTransparent) {
            this.bTransparent = false;
            debuglog("------> bTransparent set to false");
        }

        // Convert VSCP measurement event to value
        node.on('input', function(msg, send, done) {

            // Accept string/object
            var ev = new vscp.Event(msg.payload);

            // Do nothing iof no measurement anf transparent is not set
            if ( !vscp.isMeasurement(ev.vscpClass) ) {

                debuglog("Not a measurement [%s]", this.bTransparent);
                
                // If this is pre-1.0, 'send' will be undefined, so fallback to node.send
                send = send || function() {
                    node.send.apply(node, arguments);
                }

                // If transparent is selected we let all events 
                // (also non measurement events) pass through.
                if ( this.bTransparent ) {
                    debuglog("msg.payload ", msg.payload);
                    send(msg);
                }

                done();
                return;
            }

            var obj = msg;
            if (this.bToPayLoad) {
              obj = msg.payload;
            }

            // Init measurement object with defaults
            obj.measurement = {};
            obj.measurement.value = NaN;
            obj.measurement.unit= 0;
            obj.measurement.sensorindex = 0;
            obj.measurement.index = 0;
            obj.measurement.zone = 0;
            obj.measurement.subzone = 0;

            var _class = ev.vscpClass;
            var _data = ev.vscpData;

            // If we have a level I over level II class the first
            // sixteen bytes of data is the interface GUID
            if ( (ev.vscpClass >= 512) && (ev.vscpClass < 1024) ) {
                // offset = 16;
                _data = data.slice(16);
                _class -= 512; 
            }

          
            // CLASS1.MEASUREMENT
            if ( (vscpclass.VSCP_CLASS1_MEASUREMENT == ev.vscpClass) ||
                    (vscpclass.VSCP_CLASS1_MEASUREMENTX1 == ev.vscpClass) || 
                    (vscpclass.VSCP_CLASS1_MEASUREMENTX2 == ev.vscpClass) ||
                    (vscpclass.VSCP_CLASS1_MEASUREMENTX3 == ev.vscpClass) ||
                    (vscpclass.VSCP_CLASS1_MEASUREMENTX4 == ev.vscpClass) ) {
                obj.measurement.unit = vscp.getUnit(_data[0]);
                obj.measurement.sensorindex = vscp.getSensorIndex(_data[0]);                        
                obj.measurement.value = vscp.decodeMeasurementClass10(_data);                
            }
            // CLASS1.MEASUREMENT64
            else if ( ( vscpclass.VSCP_CLASS1_MEASUREMENT64 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT64X1 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT64X2 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT64X3 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT64X4 == ev.vscpClass) ) {
                obj.measurement.unit = 0;
                obj.measurement.sensorindex = 0;
                obj.measurement.value = vscp.decodeMeasurementClass60(_data);
            }
            // CLASS1.MEASUREZONE
            else if ( (vscpclass.VSCP_CLASS1_MEASUREZONE == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_MEASUREZONEX1 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_MEASUREZONEX2 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_MEASUREZONEX3 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_MEASUREZONEX4 == ev.vscpClass) ) {
                obj.measurement.index = _data[0]; 
                obj.measurement.zone = _data[1];
                obj.measurement.subzone = _data[2];                           
                obj.measurement.unit = vscp.getUnit(_data[3]);
                obj.measurement.sensorindex = vscp.getSensorIndex(_data[3]);
                obj.measurement.value = vscp.decodeMeasurementClass65(_data);
            }
            // CLASS1.MEASUREMENT32
            else if ( (vscpclass.VSCP_CLASS1_MEASUREMENT32 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT32X1 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT32X2 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT32X3 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT32X4 == ev.vscpClass) ) {
                obj.measurement.unit = 0;
                obj.measurement.sensorindex = 0;            
                obj.measurement.value = vscp.decodeClass60(_data);
            }
            // CLASS1.SETVALUEZONE
            else if ( (vscpclass.VSCP_CLASS1_SETVALUEZONE == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_SETVALUEZONEX1 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_SETVALUEZONEX2 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_SETVALUEZONEX3 == ev.vscpClass) ||
                        (vscpclass.VSCP_CLASS1_SETVALUEZONEX4 == ev.vscpClass) ) {
                obj.measurement.index = _data[0]; 
                obj.measurement.zone = _data[1];
                obj.measurement.subzone = _data[2];                           
                obj.measurement.unit = vscp.getUnit(_data[3]);
                obj.measurement.sensorindex = vscp.getSensorIndex(_data[3]);            
                obj.measurement.value = vscp.decodeMeasurementClass85(_data);
            }
            // CLASS2.MEASUREMENT_STR
            else if ( vscpclass.VSCP_CLASS2_MEASUREMENT_STR == _class ) {
                obj.measurement.sensorindex = _data[0]; 
                obj.measurement.zone = _data[1];
                obj.measurement.subzone = _data[2];                           
                obj.measurement.unit = _data[3];
                obj.measurement.value = vscp.decodeMeasurementClass1040(ev.vscpData);
            }
            // CLASS2.MEASUREMENT_FLOAT
            else if ( vscpclass.VSCP_CLASS2_MEASUREMENT_FLOAT == _class ) {
                obj.measurement.sensorindex = _data[0]; 
                obj.measurement.zone = _data[1];
                obj.measurement.subzone = _data[2];                           
                obj.measurement.unit = _data[3];
                obj.measurement.value = vscp.decodeMeasurementClass1060(ev.vscpData);
            }

            if (this.bToPayLoad) {
              msg.payload = msg.payload;
            }
            else {
              msg = obj;
            }

            debuglog("msg.payload",msg.measurement);

            if (this.bValue2Payload) {
                msg.event = msg.payload;
                if ( typeof msg.measurement.value === 'bigint' ) {
                    msg.payload = parseInt(msg.measurement.value);
                }
                else {
                    msg.payload = msg.measurement.value;
                }
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