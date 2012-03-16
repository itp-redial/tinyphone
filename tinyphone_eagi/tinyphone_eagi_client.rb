#!/usr/bin/ruby

require 'rubygems'
require 'ruby-agi'
require 'socket' 
require '/root/node_workspace/digitstream_eagi/eagi_reader.rb'

agi = AGI.new
@uniqueid = agi.uniqueid
@hangup_sent
host = 'localhost'
port = 12001
@sock = TCPSocket.open(host, port)

#method to send hangup event
def send_hangup(val)
	if !@hangup_sent
		@hangup_sent = true
		@sock.puts "id:#{@uniqueid},event:hangup,value:#{val}"
	end
end

#make sure hangup is sent on exit
Signal.trap(0, proc { send_hangup(1) })

#send new caller message
@sock.puts "id:#{@uniqueid},event:new_call,value:#{agi.callerid}|#{agi.dnid}"
#start eagi audio parsing in new thread if EAGI is activated
if (agi.enhanced == '1.0')
	Thread.new {
		EAGI_Reader.new(@sock, @uniqueid)
	}
end
# start agi keypress loop
#agi.stream_file("vm-extension")
looping = true
while looping
    result = agi.wait_for_digit(-1) # wait forever
	if result.digit
        @sock.puts "id:#{@uniqueid},event:keypress,value:#{result.digit}"
	else #hangup broke the pending AGI request
        looping = false 
    end
end
send_hangup(0)
