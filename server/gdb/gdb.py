import gdb
import json
import socket
import sys
import threading

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.bind(("", 0))
sock.listen(1)

print "python started on port %d" % (sock.getsockname()[1])

# yay, gimmicky node buffered streams
sys.stdout.flush()

(conn, addr) = sock.accept()

print "Client connected: ", addr

isStopped = False

class MessageParser:
	def __init__(self, data):
		self.data = data

	def __call__(self):
		message = json.loads(self.data)
		sys.stdout.flush()
		result = []

		# resolve a specific variable
		if message[u"type"] == u"variable":

			frame = gdb.newest_frame()
			block = frame.block()

			# split on dots to get all the nested variables
			tree = str(message[u"variable"]).split(".")

			# take first element of tree - it's the top-level symbol
			topSymbol = gdb.lookup_symbol(tree[0], block)[0]

			value = topSymbol.value(frame)

			for subSymbol in tree[1:]:
				sys.stdout.flush()
				value = value[subSymbol]

			# if it's a struct or array, parse its values
			if has_target(value.type) and is_resolvable(value.type.target()):
				# iterate over value's fields
				for field in value.type.target().fields():
					result.append(parse_value_field(field, value, frame))
			# otherwise, just return the literal value
			else:
				result = str(value)

			# send response back to client
			packet = { "event": "variable", "data":
				{ "value": result }
			}

			# See if the original message had an id number. If it did,
			# echo it back in the response.
			if message[u"id"]:
				packet["id"] = message[u"id"]

			conn.send(json.dumps(packet))

def process_messages():
	global isStopped
	while True:
		data = conn.recv(1024)
		sys.stdout.flush()
		# for now, ignore client data that was received when
		# we aren't stopped
		if isStopped != True:
			continue
		else:
			gdb.post_event(MessageParser(data))

readThread = threading.Thread(target=process_messages)
readThread.start()

def stop_handler(event):
	global isStopped
	isStopped = True
	frame = gdb.newest_frame()

	packet = { "event": "stop" }

	try:
		block = frame.block()
	except RuntimeError:
		print "herp derp"
		packet["data"] = {}
		# can't find symbols for current block, send nothing
	else:
		packet["data"] = { "blockSymbols": parse_block(block, frame) }

	packet["data"]["backtrace"] = parse_bt(frame)
	packet["data"]["location"] = parse_location(frame.find_sal())

	conn.send(json.dumps(packet))

def continue_handler(event):
	global isStopped
	isStopped = False
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
	if has_target(symType):
		symType = symType.target()

	# for structs, enumerate all of their fields
	if symType.code == gdb.TYPE_CODE_STRUCT:
		fields = symType.fields()
		for field in fields:
			parsedField = parse_field(field, symbol, frame)

			# if the field is a struct/array or pointer/ref to one,
			# mark is as something that we can later expand
			if has_target(field.type) and is_resolvable(field.type.target()):
				parsedField["resolvable"] = True

			value.append(parsedField)

	# for all other types, just record their value
	else:
		value = str(symbol.value(frame))

	return { "name": symbol.name, "type": str(symbol.type), "value": value }

def has_target(symType):
	return symType.code == gdb.TYPE_CODE_REF or symType.code == gdb.TYPE_CODE_PTR

def is_resolvable(symType):
	return symType.code == gdb.TYPE_CODE_STRUCT or symType.code == gdb.TYPE_CODE_ARRAY

def parse_field(field, symbol, frame):
	return { 
		"name": field.name, 
		"type": str(field.type),
		"value": str(symbol.value(frame)[field.name])
	}

def parse_value_field(field, value, frame):
	return {
		"name": field.name,
		"type": str(field.type),
		"value": str(value[field.name])
	}

def parse_bt(frame):
	frameNames = []

	while frame != None and frame.name() != None:
		frameNames.append({
			"name": frame.name() })
		frame = frame.older()

	return frameNames

def parse_location(frame):
	return { "file": frame.symtab.filename, "line": frame.line }

gdb.events.stop.connect(stop_handler)
gdb.events.cont.connect(continue_handler)
