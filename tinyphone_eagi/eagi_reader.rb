#!/usr/bin/ruby
require 'socket'
class EAGI_Reader
    def initialize(socket, uniqueid)
        @socket = socket
        @uniqueid = uniqueid
        run
    end
    def run
        #open up a connection to File Descriptor 3
        io = IO.new(3,"r")
        first_byte = true
        #when send counter reaches 533, send audio_level event
        send_counter = 0
        #keep track of highest level
        hero_level=0
        #byte buffer
        buf = ""
        io.each_byte do |b|
	        buf << b #put byte in buffer
	        if first_byte
		        first_byte = false
  	        else
                #convert the 2 bytes to 16 bit signed short
  		        temp = buf.unpack('s')
  		        value = temp[0]
                #check to see if this value is the highest
		        hero_level = value if value > hero_level
		        buf = "" #reset buffer
    	        first_byte = true
    	        send_counter += 1
        		if send_counter >= 553  #send through highest value
            		@socket.puts "id:#{@uniqueid},event:audio_level,value:#{hero_level}"
            		send_counter = 0
            		hero_level = 0
            	end #send counter >= 533
            end #first_byte
        end #each_byte loop
    end #run
    
end