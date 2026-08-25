///////////////////////////////////////////////////////////////////////////
// vscp-tcp-in
//
// VSCP tcp/ip input node.
//
// This file is part of the VSCP (http://www.vscp.org)
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

const vscp = require('node-vscp');

module.exports = function(RED) {
    function VscpFilterConfigNode(config) {
        RED.nodes.createNode(this,config);

        const filterPriority = (config.filterPriority || '0x00').trim();
        const maskPriority = (config.maskPriority || '0x00').trim();
        const filterClass = (config.filterClass || '0x0000').trim();
        const maskClass = (config.maskClass || '0x0000').trim();
        const filterType = (config.filterType || '0x0000').trim();
        const maskType = (config.maskType || '0x0000').trim();

        this.name = (config.name || '').trim();
        this.filterPriority = vscp.readValue(filterPriority);
        this.maskPriority = vscp.readValue(maskPriority);
        this.filterClass = vscp.readValue(filterClass);
        this.maskClass = vscp.readValue(maskClass);
        this.filterType = vscp.readValue(filterType);
        this.maskType = vscp.readValue(maskType);
        this.filterGuid = (config.filterGuid || '').trim();
        this.maskGuid = (config.maskGuid || '').trim();
    }
    RED.nodes.registerType("vscp-config-filter",VscpFilterConfigNode);
}