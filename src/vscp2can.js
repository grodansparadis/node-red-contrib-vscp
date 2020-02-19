module.exports = function(RED) {
    
    function vscpToCanNode(config) {
    
        RED.nodes.createNode(this, config);
        var node = this;
    
        // Convert VSCP event to CAN message
        node.on('input', function(msg, send, done) {

            {
                
            }

            msg.payload = msg.payload.toLowerCase();
            
            // If this is pre-1.0, 'send' will be undefined, so fallback to node.send
            send = send || function() {
                node.send.apply(node, arguments)
            }
            
            send(msg);
            done();

            if (err) {
                // Report back the error
                if (done) {
                    // Use done if defined (1.0+)
                    done(err)
                } else {
                    // Fallback to node.error (pre-1.0)
                    node.error(err, msg);
                }
            } else {
                msg.payload = result;
                send(msg);
                // Check done exists (1.0+)
                if (done) {
                    done();
                }
            }
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
} RED.nodes.registerType('vscp2can', vscpToCanNode);
