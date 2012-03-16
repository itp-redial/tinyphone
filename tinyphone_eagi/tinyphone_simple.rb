#!/usr/bin/ruby

#very simple implementation of asterisk -> server -> client stack
#only sends the digit and the caller id.
#designed for very simple control, like arduino or web page

require 'rubygems'
require 'ruby-agi'
require 'socket' 

agi = AGI.new
host = 'localhost'
port = 12001
looping = true
s = TCPSocket.open(host, port)
agi.stream_file("vm-extension")
while looping
    result = agi.wait_for_digit(-1) # wait forever
	if result.digit
        s.puts "#{result.digit},#{agi.callerid}"
	else #hangup broke the pending AGI request
        looping = false
    end
end

