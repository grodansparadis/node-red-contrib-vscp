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
        var node = this;

        // Convert VSCP measurement event to value
        node.on('input', function(msg, send, done) {

            // Accept string/object
            var ev = new vscp.Event(msg.payload);

            // Do nothing iof no measurement
            if ( !vscp.isMeasurement(ev.vscpClass) ) {
                done();
                return;
            }

            // Init meaurement object with defaulrs
            msg.measurement = {};
            msg.measurement.value = NaN;
            msg.measurement.unit= 0;
            msg.measurement.sensorindex = 0;
            msg.measurement.index = 0;
            msg.measurement.zone = 0;
            msg.measurement.subzone = 0;

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
            if ( (vscpclass.VSCP_CLASS1_MEASUREMENT == _class) ||
                    (vscpclass.VSCP_CLASS1_MEASUREMENTX1 == _class) || 
                    (vscpclass.VSCP_CLASS1_MEASUREMENTX2 == _class) ||
                    (vscpclass.VSCP_CLASS1_MEASUREMENTX3 == _class) ||
                    (vscpclass.VSCP_CLASS1_MEASUREMENTX4 == _class) ) {
                msg.measurement.unit = vscp.getUnit(_data[0]);
                msg.measurement.sensorindex = vscp.getSensorIndex(_data[0]);                        
                msg.measurement.value = vscp.decodeMeasurementClass10(_data);                
            }
            // CLASS1.MEASUREMENT64
            else if ( ( vscpclass.VSCP_CLASS1_MEASUREMENT64 == _class) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT64X1 == _class) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT64X2 == _class) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT64X3 == _class) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT64X4 == _class) ) {
                msg.measurement.unit = 0:
                msg.measurement.sensorindex = 0;
                msg.measurement.value = vscp.decodeMeasurementClass60(_data);
            }
            // CLASS1.MEASUREZONE
            else if ( (vscpclass.VSCP_CLASS1_MEASUREZONE == _class) ||
                        (vscpclass.VSCP_CLASS1_MEASUREZONEX1 == _class) ||
                        (vscpclass.VSCP_CLASS1_MEASUREZONEX2 == _class) ||
                        (vscpclass.VSCP_CLASS1_MEASUREZONEX3 == _class) ||
                        (vscpclass.VSCP_CLASS1_MEASUREZONEX4 == _class) ) {
                msg.measurement.index = _data[0]; 
                msg.measurement.zone = _data[1];
                msg.measurement.subzone = _data[2];                           
                msg.measurement.unit = vscp.getUnit(_data[3]);
                msg.measurement.sensorindex = vscp.getSensorIndex(_data[3]);
                msg.measurement.value = vscp.decodeMeasurementClass65(_data);
            }
            // CLASS1.MEASUREMENT32
            else if ( (vscpclass.VSCP_CLASS1_MEASUREMENT32 == _class) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT32X1 == _class) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT32X2 == _class) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT32X3 == _class) ||
                        (vscpclass.VSCP_CLASS1_MEASUREMENT32X4 == _class) ) {
                msg.measurement.unit = 0:
                msg.measurement.sensorindex = 0;            
                msg.measurement.value = vscp.decodeClass60(_data);
            }
            // CLASS1.SETVALUEZONE
            else if ( (vscpclass.VSCP_CLASS1_SETVALUEZONE == _class) ||
                        (vscpclass.VSCP_CLASS1_SETVALUEZONEX1 == _class) ||
                        (vscpclass.VSCP_CLASS1_SETVALUEZONEX2 == _class) ||
                        (vscpclass.VSCP_CLASS1_SETVALUEZONEX3 == _class) ||
                        (vscpclass.VSCP_CLASS1_SETVALUEZONEX4 == _class) ) {
                msg.measurement.index = _data[0]; 
                msg.measurement.zone = _data[1];
                msg.measurement.subzone = _data[2];                           
                msg.measurement.unit = vscp.getUnit(_data[3]);
                msg.measurement.sensorindex = vscp.getSensorIndex(_data[3]);            
                msg.measurement.value = vscp.decodeMeasurementClass85(_data);
            }
            // CLASS2.MEASUREMENT_STR
            else if ( vscpclass.VSCP_CLASS2_MEASUREMENT_STR == _class ) {
                msg.measurement.sensorindex = _data[0]; 
                msg.measurement.zone = _data[1];
                msg.measurement.subzone = _data[2];                           
                msg.measurement.unit = _data[3];
                msg.measurement.value = vscp.decodeMeasurementClass1040(ev.vscpData);
            }
            // CLASS2.MEASUREMENT_FLOAT
            else if ( vscpclass.VSCP_CLASS2_MEASUREMENT_FLOAT == _class ) {
                msg.measurement.sensorindex = _data[0]; 
                msg.measurement.zone = _data[1];
                msg.measurement.subzone = _data[2];                           
                msg.measurement.unit = _data[3];
                msg.measurement.value = vscp.decodeMeasurementClass1060(ev.vscpData);
            }

            debuglog("msg.payload",msg.measurement);

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