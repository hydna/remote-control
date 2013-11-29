var remote = {
    domain: "remote-control.hydna.net",
    channel: null,
    synctimer: null,
    closetimer: null,
    currentchannel: 0,
    synced: false,
    
    connect: function(mychannel) {
        remote.synced = false;
        remote.channel = new HydnaChannel(remote.domain+'/'+mychannel, 'rw');
        remote.channel.onmessage = function(e) {
            if (parseInt(e.data) == mychannel) {
                remote.synced = true;	
                remote.channel.send("synced");
            } else {
                if (remote.synced) {
                    switch(e.data) {
                        case "left":
                            Reveal.navigateLeft();
                            break;
                        case "right":
                            Reveal.navigateRight();
                            break;
                        case "up":
                            Reveal.navigateUp();
                            break;
                        case "down":
                            Reveal.navigateDown();
                            break;
                        case "reset":
                            Reveal.navigateTo(0,0);
                            break;
                    }
                }
            }
        }
    },
    
    promptconnect: function() {
        var code = parseInt(prompt("Enter slideshow code", ""));
        
        if (!isNaN(code) && code > 1 && code != remote.currentchannel) {
            if (remote.channel) {
                remote.channel.close();
            }
            
            var mychannel = String(code);
            
            $('#loader_id').show();
            $('#reconnect_id').hide();
            
            // remote-control
            remote.channel = new HydnaChannel(remote.domain+'/'+mychannel, 'rw');
            
            remote.channel.onmessage = function(e) {
                switch(e.data) {
                    case "synced":
                        clearTimeout(remote.synctimer);
                        $('#reconnect_id').hide();
                        $('#swipe_id').show();
                        $('#loader_id').hide();
                        break;
                }
            }
            
            remote.channel.onopen = function(e) {
                clearTimeout(remote.closetimer);
                
                remote.currentchannel = code; 
                remote.channel.send(mychannel);
                
                clearTimeout(remote.synctimer);
                remote.synctimer = setTimeout( function() {
                    $('#reconnect_id').show();
                    $('#loader_id').hide();
                }, 2000);
            }
            
            remote.channel.onclose = function(e) {
                clearTimeout(remote.closetimer);
                remote.closetimer = setTimeout( function() {
                    $('#reconnect_id').show();
                    $('#swipe_id').hide();
                    $('#loader_id').hide();
                }, 2000);
            }
        
        } else {
            if(code != "") {
                if (code == remote.currentchannel) {
                    alert("You are already connected to this channel");
                    remote.channel.send(String(code));
                } else {
                    alert("Invalid channel");
                }
            }
        }
    },
    
    init : function() {
        if (navigator.userAgent.indexOf('iPhone') != -1 || navigator.userAgent.indexOf('iPod') != -1 || navigator.userAgent.indexOf('Android') != -1) {
            $('body').addClass("mobile");
            
            $('body').append("<div class='info'><span id='swipe_id'>Swipe to change slide</span><a href='#' id='reconnect_id'>Tap to Connect</a><span style='display: none;' id='loader_id' class='loader'></span></div>");
            
            $('#swipe_id').hide();
            
            $('#reconnect_id').bind('touchstart', function(e) {
                e.preventDefault();
                remote.promptconnect();
            });
            
            var startx = 0;
            var starty = 0;
            var currentx = 0;
            var currenty = 0;
            
            $("body").bind("touchmove", function(event) {
                var e = event.originalEvent;
                
                if( e.targetTouches[0] ){
                    currentx = e.targetTouches[0].pageX;
                    currenty = e.targetTouches[0].pageY;
                }
                
                e.preventDefault();
            });
            
            $("body").bind("touchend", function(event) {
                if (startx != currentx || starty != currenty) {
                    
                    if (remote.channel != null) { 
                        
                        var dx = startx - currentx;
                        var dy = starty - currenty;
                        
                        var angle = Math.atan2(dx, dy) * (180/Math.PI);
                        
                        if (angle < 0){
                            
                            if (angle > -45){
                                remote.channel.send("down");
                            } else if (angle < -135){
                                remote.channel.send("up");
                            } else {
                                remote.channel.send("left");
                            }
                        
                        } else {
                            if (angle < 45) {
                                remote.channel.send("down");
                            } else if (angle > 135) {
                                remote.channel.send("up");
                            } else {
                                remote.channel.send("right");
                            }
                        }
                    }   
                }
            });
            
            $("body").bind("touchstart", function(event) {
                var e = event.originalEvent;
                if(e.targetTouches[0]){
                    startx = e.targetTouches[0].pageX;
                    starty = e.targetTouches[0].pageY;
                    currentx = startx;
                    currenty = starty;
                }
                
                e.preventDefault();
            });
            
            remote.promptconnect();
        } else {
            Reveal.initialize({
                controls: true,
                progress: true,
                history: true,
                mouseWheel: true,
                rollingLinks: false,
                theme: 'default',
                transition: 'default'
            });
            
            var mychannel = Math.round(Math.random()*(10000-1000))+1000;
            var channel = null;
            
            $("#secret_id").html(mychannel);
            
            remote.connect(mychannel);
        }
    }
};

$(document).ready(function(){
    remote.init();
});
