var accelData = function(options){
	
	var _this = this;
	
	this.socketInstance = null;
	this.watchId = null;
	this.options = options;
	
	this.accelConnect = function(){
		
		_this.options.ipAddress = _this.options.ipAddress || '127.0.0.1';
		_this.options.port = _this.options.port || '8080';
		_this.options.ssl = (_this.options.ssl === true)? 'https' : 'http';
		
		var connectAddress = _this.options.ssl + '://' + _this.options.ipAddress + ':' + _this.options.port;
		
		if(_this.socketInstance === null){
			
			_this.socketInstance = io.connect(connectAddress, {'force new connection':true});
			console.log('Socket Initialized');
			
			//When the socket connects successfully.
			_this.socketInstance.on('connect',function(){
				_this.accelStartWatch(_this.options.frequency);
			});
			
			_this.socketInstance.on('update accel data',function(data){
				$('#accel-direction').empty().append(data.coordinateData);
			});
			
		} else {
			_this.accelStartWatch(_this.options.frequency);
		}	
		return;
	};
	
	this.accelDisconnect = function(){
		_this.socketInstance.disconnect();
		_this.accelStopWatch();
	}
	
	this.accelStartWatch = function(frequency){
		frequency = frequency || 500;
		var options = { frequency: frequency };
		_this.watchId = navigator.accelerometer.watchAcceleration(_this.accelSuccess, _this.accelError, options);
		
		console.log('Accelerometer watch initialized');
		return;
	};
	
	this.accelStopWatch = function(){
	  if (_this.watchId) {
	        navigator.accelerometer.clearWatch(_this.watchId);
	        _this.watchId = null;
	    }
	  
	  return;
	};
	
	this.accelSuccess = function(acceleration){
		//update the coordinates in the view
		$('.x-coordinate').html(acceleration.x);
		$('.y-coordinate').html(acceleration.y);
		$('.z-coordinate').html(acceleration.z);
		
		//send data to the server via the socket
		if(_this.socketInstance !== null){
			_this.socketInstance.emit('accel data',{
				posX:acceleration.x,
				posY:acceleration.y,
				posZ:acceleration.z});
		}
	};
	
	this.accelError = function(){
		console.log('Accelerometer Error');
	}
	this.accelClearData = function(){
		$('.x-coordinate').empty();
		$('.y-coordinate').empty();
		$('.z-coordinate').empty();
	}
};

// Wait for device API libraries to load
//
document.addEventListener("deviceready", onDeviceReady, false);

//Function to enable stop and clear only if start is clicked
function enableStopClear(){
	$('#stop-accel').attr('disabled',false).removeClass('disabled');
	//Disable the start and back functionality
	$('#start-accel').attr('disabled',true).addClass('disabled');
	$('#back-accel').attr('disabled',true).addClass('disabled');
}

//Function to disable stop and clear until start is clicked
function disableStopClear(){
	$('#stop-accel').attr('disabled',true).addClass('disabled');
	//Enable the start and back functionality
	$('#start-accel').attr('disabled',false).removeClass('disabled');
	$('#back-accel').attr('disabled',false).removeClass('disabled');
}

//device APIs are available
//
function onDeviceReady() {
	
		//Flag to check the disconnect function later
		var socketCreated = false;
		
		$('#ip-setup-form-submit').bind('click',function(e){
			var ip   = $('#ip-address').val();
			var port = $('#ip-port').val();
			var ssl  = $('#ip-ssl').is(':checked');

			$('#accel-setup').fadeOut('fast',function(){
				$('#accel-streamer').fadeIn('fast',function(){
					//Disable unnecessary functionality
					disableStopClear();
					
					//Initializations go here
					var accel = new accelData({
						ipAddress : ip,
						port: port,
						ssl : ssl,
						frequency:300,
					});

					$('#start-accel').bind('click',function(){
						accel.accelConnect();
						enableStopClear();
						socketCreated = true;
					});

					$('#stop-accel').bind('click',function(){
						accel.accelStopWatch();
						disableStopClear();
					});

					$('#clear-accel').bind('click',function(){
						accel.accelClearData();
					});

					$('#back-accel').bind('click',function(){
						accel.accelStopWatch();
						
						if(socketCreated)
							accel.accelDisconnect();
						
						accel.socketInstance = null;
						
						accel.accelClearData();
						
						$('#accel-streamer').fadeOut('fast',function(){
							$('#accel-direction').empty();
							$('#accel-setup').fadeIn('fast');
						});
					});
				});
			});
		});

}