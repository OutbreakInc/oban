var net = require("net");

////////////////////////////////////////////////////////////////

String.prototype.trim = function()
{
	var	str = String.prototype.replace.call(this, /^\s\s*/, ''), ws = /\s/, i = str.length;
	while(ws.test(String.prototype.charAt.call(str, --i)));
	return(String.prototype.slice.call(str, 0, i + 1));
};

String.prototype.padFront = function(length, char)
{
	var l = this.length;
	var s = this;
	if(char == undefined)	char = " ";
	if(length > l)
	{
		for(var i = 0; i < (length - l); i++)
			s = char + s;
	}
	return(s);
};

Date.prototype.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
Date.prototype.toCompactString = function()
{
	var tzHours = (Date.prototype.getTimezoneOffset.call(this) / -60);
	return(		Date.prototype.getDate.call(this).toString().padFront(2, "0") +
				Date.prototype.months[Date.prototype.getMonth.call(this)] +
				Date.prototype.getFullYear.call(this) +
				"/" +
				Date.prototype.getHours.call(this).toString().padFront(2, "0") +
				Date.prototype.getMinutes.call(this).toString().padFront(2, "0") +
				Date.prototype.getSeconds.call(this).toString().padFront(2, "0") +
				((tzHours >= 0)? "+" : "") +
				tzHours
			);
};

if(JSON == undefined){JSON = {"parse": function(str){return(eval("(" + str + ")"));}};}

////////////////////////////////

ARMTarget.prototype =
{
	"memoryMap":	'<?xml version="1.0"?>\
					<!DOCTYPE memory-map PUBLIC "+//IDN gnu.org//DTD GDB Memory Map V1.0//EN" "http://sourceware.org/gdb/gdb-memory-map.dtd">\
					<memory-map>\
						<memory type="flash" start="0x00000000" length="32768">\
							<property name="blocksize">4096</property>\
						</memory>\
						<memory type="ram" start="0x10000000" length="8192"/>\
						<memory type="rom" start="0x1FFF0000" length="16384"/>\
						<memory type="ram" start="0x40000000" length="376832"/>\
						<memory type="ram" start="0x50000000" length="262144"/>\
						<memory type="ram" start="0xE0000000" length="1048576"/>\
					</memory-map>',
	
	"runState": 5,	//halted signal
	
	//5555aaaa aaaa5555 5555aaaa 00000000 10100140 100c0140 10080140 f8fd3ff3 f435ee2c 9afe695b 2ff77faf b8b6cf7e b7fc7fc9 fc1f0020 ffffffff 40000008
	
	"registers": [		"00000000", "00000000", "00000000", "00000000",
						"00000000", "00000000", "00000000", "00000000",
						"00000000", "00000000", "00000000", "00000000",
						"00000000", "FC1F0010", "FEFFFFFF", "C0000000",
					],
	"cpsr":		"20000000",	//special register, index #25
	
	"tracepoints": [],
	
	"getRunState": function()
	{
		return(this.runState);
	},
	"setRunState": function(runState)
	{
		switch(runState)
		{
		case 0:		//run
			this.runState = 0;
			break;
		case 1:		//single-step
			
			//@@hack to simulate stepping
			var v = this.registers[15];
			var i = parseInt(v[6] + v[7] + v[4] + v[5] + v[2] + v[3] + v[0] + v[1], 16);
			v = (i + 2).toString(16).padFront(8, "0");
			this.registers[15] = v[6] + v[7] + v[4] + v[5] + v[2] + v[3] + v[0] + v[1];
			
			this.runState = 5;
			break;
		case 5:		//stop
			this.runState = 5;
			break;
		}
	},
	"getARMRegisterState": function(regNum)
	{
		if(regNum != undefined)
		{
			console.log("getting register #" + regNum);
			if(regNum == 25)	return(this.cpsr);
			else				return(this.registers[regNum]);
		}
		else
			return(this.registers.join(""));
	},
	"setARMRegisterState": function(value, regNum)
	{
		if(regNum != undefined)
		{
			console.log("setting register #" + regNum);
			if(regNum == 25)	this.cpsr = value.substr(0, 8);
			else				this.registers[regNum] = value.substr(0, 8);
		}
		else
		{
			for(var i = 0; i < this.registers.length; i++)
				this.registers[i] = value.substr(i * 8, 8);
		}
	},
	"getMemory": function(address, length)
	{
		return("00000000");
	},
	"setMemory": function(address, length, value)
	{
	},
};
function ARMTarget()
{
}

////////////////////////////////

GDBServer.prototype =
{
	"connection": null,
	"target": null,
	
	"ExecuteGDBPacket": function(command)
	{
		var commandDisplay = command.replace(String.fromCharCode(3), "[break]");
		console.log("#" + this.connection.id + " -> " + commandDisplay);
		
		while(command.length > 0)
		{
			//find control chars first
			switch(command.charCodeAt(0))
			{
			case 43:	//"+", ack
				command = command.substr(1);
				continue;
			case 45:	//"-", nack
				//retransmit
				command = command.substr(1);
				continue;
			case 3:		//"ctrl+c", break
			case 126:	//"~", break
				this.processCommand("~");	//translate to a simpler character and execute it
				command = command.substr(1);
				continue;
			}
			
			//now try to extract packets
			var start = this.findCharUnescaped(command, "$");
			var end = this.findCharUnescaped(command, "#", start);

			if((start == -1) || (end == -1) || (end <= start))
			{
				//maybe it's a notification
				start = this.findCharUnescaped(command, "%");
				end = this.findCharUnescaped(command, "#", start);
			}

			//still no good?
			if((start == -1) || (end == -1) || (end <= start))
			{
				console.log("not a valid command or notification.");
				return;
			}
			
			var payload = command.substr(start + 1, end - start - 1);

			//check packet validity
			if(command.substr(end + 1, 2).toLowerCase() != this.makePacketChecksum(payload))
			{
				console.log("packet checksum error: checksum(\"" + payload + "\") != \"" + this.makePacketChecksum(payload) + "\".");
				this.respond("-");	//nack, bro
				return;
			}
			
			//sequence support
			var seq = command.substr(end + 3, 4);
			if(seq.length != 4)
			{
				console.log("packet sequence error: missing or corrupt sequence number.");
				this.respond("-");	//nack, bro
				return;
			}
			
			var seqNum = parseInt(seq, 16);
			if(isNaN(seqNum))
			{
				console.log("packet sequence error: corrupt sequence number '" + seqNum + "'");
				this.respond("-");	//nack, bro
				return;
			}
			
			console.log("PROCESSING: >>>" + payload + "<<< (checksum " + command.substr(end + 1, 2).toLowerCase() + ", seq " + seq + " (" + seqNum + ") )");
			this.processCommand(payload, seqNum);
			
			command = command.substr(end + 7);
		}
	},
	
	"processCommand": function(message, seqNum)
	{
		var commandLen = this.findCharUnescaped(message, ":");
		if(commandLen != -1)
		{
			command = message.substr(0, commandLen);
			message = message.substr(commandLen + 1);
		}
		else
		{
			command = message;
			message = "";
		}
		
		if(command.substr(0, 5) == "qRcmd")
		{
			if(command[5] == ",")
				message = message.substr(6);
			
			command = command.substr(0, 5);
		}
		
		switch(command[0])
		{
		case "c":
		case "G":
		case "H":
		case "i":
		case "m":
		case "M":
		case "p":
		case "P":
		case "Z":
		case "z":
			commandCode = command[0];
			break;
		default:
			commandCode = command;
			break;
		}
		
		switch(commandCode)
		{
		case "qSupported":
			this.respond("+" + this.wrapPacket("PacketSize=3fff;qXfer:memory-map:read+;QStartNoAckMode+", seqNum));
			return;
		case "QStartNoAckMode":
			this.respond("+" + this.wrapPacket("OK", seqNum));
			return;
		case "qC":
			this.respond("+" + this.wrapPacket("0", seqNum));
			return;
		case "qAttached":
			this.respond("+" + this.wrapPacket("0", seqNum));	//0 = spawned new process, 1 = attached
			return;
		case "qTStatus":
			this.respond("+" + this.wrapPacket("T0;tnotrun:0", seqNum));
			return;
		case "qXfer":
			var typeLen = this.findCharUnescaped(message, ":");
			var subject = message.substr(0, typeLen);
			switch(subject)
			{
			case "memory-map":
				this.respond("+" + this.wrapPacket("l" + this.target.memoryMap, seqNum));
				return;
			default:
				console.log("unknown subject " + subject, "message = " + message);
				break;
			}
			break;
		case "qSymbol":
			this.respond("+" + this.wrapPacket("OK", seqNum));
			return;
		case "qRcmd":
			
			switch(message)
			{
			case "":
				this.respond("+" + this.wrapPacket("OK", seqNum));
				return;
			}
			
			//tracepoints
		case "qTfP":
		case "qTsP":
			break;
			//trace state variables
		case "qTfV":
		case "qTsV":
			break;
		
		case "~":	//translated break character
			this.target.setRunState(5);	//break
			this.respond("+" + this.wrapPacket("S" + this.target.getRunState().toString(16).padFront(2, "0"), seqNum));
			return;
			
		case "?":	//reason target isn't running
			this.respond("+" + this.wrapPacket("S" + this.target.getRunState().toString(16).padFront(2, "0"), seqNum));
			return;
			
		case "H":	//set thread for action
			this.respond("+" + this.wrapPacket("OK", seqNum));	//only have one thread, ignore
			return;
			
		case "g":	//read general registers
			this.respond("+" + this.wrapPacket(this.target.getARMRegisterState(), seqNum));
			return;
		case "p":	//read single general register
			this.respond("+" + this.wrapPacket(this.target.getARMRegisterState(parseInt(command.substr(1), 16)), seqNum));
			return;
		case "G":	//write general registers
			this.target.setARMRegisterState(command.substr(1));
			this.respond("+" + this.wrapPacket("OK", seqNum));
			return;
		case "P":	//write single general register
			var eq = this.findCharUnescaped(command, "=");
			//console.log(">>>" + command + " -- idx=" + eq + " -- " + command.substr(eq + 1) + " -- " + command.substr(1, eq - 1));
			this.target.setARMRegisterState(command.substr(eq + 1), parseInt(command.substr(1, eq - 1), 16));
			this.respond("+" + this.wrapPacket("OK", seqNum));
			return;
		case "m":	//read memory
			var comma = this.findCharUnescaped(command, ",");
			console.log(">>>" + command + " => idx = " + comma + ", read *" + command.substr(1, comma - 1) + "{" + command.substr(comma + 1) + "}");
			this.respond("+" + this.wrapPacket(this.target.getMemory(command.substr(1, comma - 1), parseInt(command.substr(comma + 1), 16)), seqNum));
			return;
		case "M":	//write memory
			var comma = this.findCharUnescaped(command, ",");
			console.log(">>>" + command + " => idx = " + comma + ", write *" + command.substr(1, comma - 1) + "{" + command.substr(comma + 1) + "} = " + message);
			this.target.setMemory(command.substr(1, comma - 1), parseInt(command.substr(comma + 1), 16), message);
			this.respond("+" + this.wrapPacket("OK", seqNum))
			return;
		
		
		case "vCont":
		case "vCont;c":
		case "c":	//continue
			this.target.setRunState(0);	//run
			this.respond("+");
			return;
		case "vCont;s":
		case "s":	//step
			//simulate single-step
			this.target.setRunState(1);	//single-step
			this.respond("+" + this.wrapPacket("S" + this.target.getRunState().toString(16).padFront(2, "0"), seqNum));
			return;
		case "vCont?":
			this.respond("+" + this.wrapPacket("vCont;cst", seqNum));
			return;
			
		case "Z":	//add/set breakpoint
			console.log("ADD BREAKPOINT");
			var args = command.split(",");	//Z<type>,<hex location>,<num bytes>
			//console.log(args);
			switch(args[0])
			{
			case "Z0":	//memory (software trap) breakpoint, e.g. 'bkpt' on ARM, 'break' on AVR, 'int' on x86
				//add the breakpoint to the sw-bp map, then composite it into the appropriate sector and re-flash that to the chip when we continue execution
				//  if we stop on a sw breakpoint, we'll need to look up the original instruction and execute it from RAM right before continuing
				this.respond("+" + this.wrapPacket("OK", seqNum));
				return;
			case "Z1":	//hardware execution breakpoint
				this.respond("+" + this.wrapPacket("OK", seqNum));
				return;
			case "Z2":	//hardware data write breakpoint
			case "Z3":	//hardware data read breakpoint
			case "Z4":	//hardware data access breakpoint
			}
		case "z":	//remove breakpoint
			var args = command.split(",");
			//console.log(args);
			switch(args[0])
			{
			case "z0":	//memory (software trap) breakpoint
				this.respond("+" + this.wrapPacket("OK", seqNum));
				return;
			case "z1":	//hardware execution breakpoint
				this.respond("+" + this.wrapPacket("OK", seqNum));
				return;
			case "z2":	//hardware data write breakpoint
			case "z3":	//hardware data read breakpoint
			case "z4":	//hardware data access breakpoint
				break;
			}
		}
		this.respond("+" + this.wrapPacket("", seqNum));	//empty response (unsupported command)
	},
	
	"findCharUnescaped": function(str, char)
	{
		var index = -1;
		while((index = str.indexOf(char, index)) != -1)
		{
			if(str[index - 1] != "{")
				return(index);
		}
		return(-1);
	},
	
	"makePacketChecksum": function(str)
	{
		var checksum = 0;
		for(var i = 0; i < str.length; i++)
			checksum += str.charCodeAt(i);
		return((checksum & 0xFF).toString(16).padFront(2, "0"));
	},
	
	"makeSeqNum": function(seqNum)
	{
		var s = seqNum.toString(16);
		return("0000".substr(s.length) + s);
	},
	
	"wrapPacket": function(response, seqNum)
	{
		return("$" + response + "#" + this.makePacketChecksum(response) + this.makeSeqNum(seqNum));
	},
	
	"respond": function(response)
	{
		console.log("#" + this.connection.id + " <- " + response);
		this.connection.write(response);
	},
};
function GDBServer(connection)
{
	this.connection = connection;
	
	this.target = new ARMTarget();
	
	this.connection.setEncoding("utf8");
	
	console.log("new GDB connection #" + this.connection.id);
	this.connection.on("end", function()
		{
			console.log("GDB connection #" + this.connection.id + " closed");
		}.bind(this));
	this.connection.on("data", function(command)
		{
			this.ExecuteGDBPacket(command);
		}.bind(this));
}

var connectionNextID = 0;
var server = net.createServer(function(connection)
	{
		connection.id = connectionNextID++;
		
		var gdbServer = new GDBServer(connection);
	});

var port = 1033;
for(var attempts = 0; attempts < 10; attempts++)
{
	try
	{
		server.listen(port, function()
			{
				console.log("server listening on port " + port);
			});
		break;
	}
	catch(error)
	{
		port++;
	}
}