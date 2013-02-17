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

	# iterate thru all the blocks up to the function boundary
	# and aggregate all the variables
	while block.function == None:
		symbols += symbols_from_block(block, frame)
		block = block.superblock

	# get the symbols that are in the function's arguments block
	symbols += symbols_from_block(block, frame)

	return symbols

def symbols_from_block(block, frame):
	symbols = []
	for symbol in block:
	 	symbols.append(parse_symbol(symbol, frame))

	return symbols

def parse_symbol(symbol, frame):
	symName = symbol.name
	symType = symbol.type
	value = []

	# resolve to target type, if necessary
	if symType.code == gdb.TYPE_CODE_REF or symType.code == gdb.TYPE_CODE_PTR:
		symType = symType.target()

	# for structs, enumerate all of their fields
	if symType.code == gdb.TYPE_CODE_STRUCT:
		fields = symType.fields()
		for field in fields:
			value.append(parse_field(field, symbol, frame))
	# for all other types, just record their value
	else:
		value = str(symbol.value(frame))

	return { "name": symbol.name, "type": str(symbol.type), "value": value }

def parse_field(field, symbol, frame):
	return { 
		"name": field.name, 
		"type": str(field.type),
		"value": str(symbol.value(frame)[field.name])
	}

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
