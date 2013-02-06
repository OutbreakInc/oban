import gdb
import json
import socket
import sys

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.bind(("", 0))
sock.listen(1)

print "python started on port %d" % (sock.getsockname()[1])

# yay, gimmicky node buffered streams
sys.stdout.flush()

(conn, addr) = sock.accept()

print "Client connected: ", addr

def stop_handler(event):
	frame = gdb.newest_frame()
	block = frame.block()

	blockSymbols = parse_block(block, frame)
	backtrace = parse_bt(frame)
	location = parse_location(frame.find_sal())

	packet = { "event": "stop", "data": 
		{"blockSymbols": blockSymbols, 
		"backtrace": backtrace,
		"location": location}
		}

	conn.send(json.dumps(packet));

def continue_handler(event):
	conn.send(json.dumps({"event": "continue"}))

def parse_block(block, frame):
	symbols = []

	for symbol in block:
		symbols.append({ 
			"name": symbol.name, 
			"type": str(symbol.type),
			"value": str(symbol.value(frame)) })

	return symbols

def parse_bt(frame):
	frameNames = []

	while frame != None:
		frameNames.append({
			"name": frame.name() })
		frame = frame.older()

	return frameNames

def parse_location(frame):
	return { "file": frame.symtab.filename, "line": frame.line }

gdb.events.stop.connect(stop_handler)
gdb.events.cont.connect(continue_handler)
