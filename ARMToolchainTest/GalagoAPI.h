#ifndef __GALAGO_H__
#define __GALAGO_H__

#include <stddef.h>

typedef unsigned char	byte;

namespace Galago {

class Buffer
{
public:
	inline					Buffer(void) {};
	inline					Buffer(Buffer const& b);
	inline Buffer&			operator =(Buffer const& b);
	
	inline size_t				length() const;
	inline byte*			bytes();
	inline byte const*		bytes() const;
	
	static inline Buffer	New(char const* cStr);
	static inline Buffer	New(size_t length);
	static inline Buffer	New(void* b, size_t length);
	
	Buffer					operator +(Buffer const& b) const;
	Buffer&					operator +=(Buffer const& b);
	
	bool					operator ==(Buffer const& b) const;
	bool					operator ==(char const* cStr) const;
	
	unsigned int			ParseUint(int base = 10);
	signed int				ParseInt(int base = 10);
	
	bool					StartsWith(byte const* str, size_t length) const;
	bool					StartsWith(char const* cStr) const;
	bool					Equals(byte const* str, size_t length) const;
	
	byte					operator[](size_t offset) const;
	
	Buffer					Slice(size_t start, size_t end);
	size_t					IndexOf(byte b, size_t offset = 0);
	size_t					IndexOf(Buffer b, size_t offset = 0);
};

class IO
{
public:

	class Pin
	{
		friend class IO;

	public:
		typedef enum
		{
			DigitalInput,
			DigitalOutput,
			AnalogInput,
			
			Reset,
			SPI,
			I2C,
			UART,
			PWM,
			USB,

			ClockOutput,
			Wakeup,

			Manual = 0xFE,
			Default = 0xFF,
		} Mode;

		typedef enum
		{
			Normal,
			PullUp,
			PullDown,
			
			Sensitive,

			OpenDrain,
		} Feature;
		
		inline			Pin(void)				{}
		inline			Pin(Pin const& p)		{}
		inline	Pin&	operator =(Pin const& p)	{}

		inline	Pin&	operator =(bool value)	{}
		inline	Pin&	operator =(int value)	{}
		inline			operator bool(void)		{return((bool)read());}

		int				read(void);
		void			write(int value);

		inline	void	setOutput(void)		{setMode(DigitalOutput);}
		inline	void	setInput(void)		{setMode(DigitalInput);}
		inline	void	setAnalog(void)		{setMode(AnalogInput);}
		inline	void	setPWM(void)		{setMode(PWM);}
		
		void			setMode(Mode mode, Feature feature = Normal);

	private:
		inline			Pin(unsigned int value): v(value)	{setMode(Default);}
		
		//bits 26-31:	part-specific data

		//bit 25:		last digital input value
		//bit 24:		digital output value
		
		//bits 16-23:	pin mode
		
		//bits 12-16:	(unallocated)

		//bits 8-11:	IO bank
		//bits 0-7:		pin number
		unsigned int	v;
	};

	class SPI
	{
	public:
		typedef enum
		{
			Master,
			Slave,
		} Role;
		
		typedef enum
		{
			Mode0,	//SCK idles low, data changed on SCK's falling edge, read on rising edge.
			Mode1,	//SCK idles low, data changed on SCK's rising edge, read on falling edge.
			Mode2,	//SCK idles high, data changed on SCK's falling edge, read on rising edge.
			Mode3,	//SCK idles high, data changed on SCK's rising edge, read on falling edge.
		} Mode;

		void			setup(int bitRate = 2e6, Role role = Master, Mode mode = Mode0);

		unsigned short	read(int length, unsigned short writeChar = 0);
		
		inline void		readAndWrite(char const* s, int length, byte* bytesReadBack) {write((byte const*)s, length, bytesReadBack);}
		inline void		readAndWrite(byte const* s, int length, byte* bytesReadBack) {write(s, length, bytesReadBack);}
		inline void		readAndWrite(unsigned short const* s, int length, byte* bytesReadBack) {write(s, length, bytesReadBack);}
		
		inline void		write(char c, int length = 1)		{write((unsigned short)c, length);}
		inline void		write(byte b, int length = 1)		{write((unsigned short)b, length);}
		inline void		write(short h, int length = 1)		{write((unsigned short)h, length);}
		void			write(unsigned short h, int length = 1);

		inline void		write(char const* s, int length, byte* bytesReadBack = 0)	{write((byte const*)s, length, bytesReadBack);}
		void			write(byte const* s, int length, byte* bytesReadBack = 0);
		void			write(unsigned short const* s, int length, byte* bytesReadBack = 0);
	};

	class I2C
	{
	};

	class UART
	{
	public:
		typedef enum
		{

		} Event;
		
		void			setup(int baudRate = 38400);
		
		typedef void (*UARTCallback)(UART& uart, Buffer bytes);
		void			on(UARTCallback callback, void* receiver = 0);

		inline void		write(char c, int length = 1)		{write((unsigned short)c, length);}
		inline void		write(byte b, int length = 1)		{write((unsigned short)b, length);}
		inline void		write(short h, int length = 1)		{write((unsigned short)h, length);}
		void			write(unsigned short h, int length = 1);
		
		//inline void		write(char const* s, int length, byte* bytesReadBack = 0)	{write((byte const*)s, length, bytesReadBack);}
		void			write(byte const* s, int length, byte* bytesReadBack = 0);
		//void			write(unsigned short const* s, int length, byte* bytesReadBack = 0);
	};

	Pin			P0;
	Pin			P1;
	Pin			P2;
	Pin			P3;
	Pin			P4;
	Pin			P5;
	Pin			P6;
	Pin			RTS;
	Pin			CTS;
	Pin			TXD;
	Pin			RXD;
	Pin			SDA;
	Pin			SCL;
	Pin			SCK;
	Pin			SEL;
	Pin			MISO;
	Pin			MOSI;
	Pin			A0;
	Pin			A1;
	Pin			A2;
	Pin			A3;
	Pin			A5;
	Pin			A7;
	
	Pin			led;

	SPI			spi;
	
	I2C			i2c;

	UART		serial;
	
				IO(void);
};

class System
{
public:
	unsigned int	getCoreFrequency(void) const;
	void			sleep(void);
	void			delay(int microseconds);

					System(void);
};

static IO		IO;
static System	System;

}	//ns Galago

#endif //defined __GALAGO_H__