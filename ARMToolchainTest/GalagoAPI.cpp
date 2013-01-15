#include "GalagoAPI.h"
#include "LPC13xx.h"

using namespace Galago;

				System::System(void)
{
	//@@ if the core reset due to a WDT interrupt, store the external clock kHz as "no crystal", else:
		//@@ set up timer2 (32bit) to count up 1:1 with the core
		//@@ set watchdog to a known interval: WatchdogControl_Frequency_4_0MHz * 4 * 1000
		//@@ start counter and watchdog
		//@@ wait for interrupt

	//@@ when a watchdog interrupt occurs, read the timer2 count value
		//@@ stop and disable timer2, disable watchdog
		//@@ store the count value as the approximate KHz of the external clock
}

unsigned int	System::getCoreFrequency(void) const
{
	switch(*LPC1300::MainClockSource)
	{
	case LPC1300::MainClockSource_InternalCrystal:
		return(12e6);
	case LPC1300::MainClockSource_PLLInput:
		return(0);
	case LPC1300::MainClockSource_WDTOscillator:
		return(0);
	case LPC1300::MainClockSource_PLLOutput:
		return(0);
	}
	return(0);
}

void			System::sleep(void)
{

}

void			System::delay(int microseconds)
{

}

void			System::addTimedTask(int period, void (*task)(void*), void* ref)
{
	
}

//IO Pins

//on Galago 0BAB04xx, here is what the bits store:

	//bits 26-31:	abbreviated memory address of the IO pin configuration register

	//bit 25:		last digital input value
	//bit 24:		digital output value
	
	//bits 16-23:	pin mode
	
	//bits 15-16:	(unallocated)

	//bits 12-14:	analog channel number

	//bits 8-11:	IO bank
	//bits 0-7:		pin number


#define PinID(port, pin) ((port << 3) | (port << 2) | pin)

static unsigned int volatile*	gpioAddress(unsigned int v)		{return((unsigned int volatile*)(0x50000000 | ((v & 0xF00) << 8) | (4 << (v & 0xFF))));}
static unsigned int volatile*	gpioDirAddress(unsigned int v)	{return((unsigned int volatile*)(0x50000000 | ((v & 0xF00) << 8) | 0x8000));}
static unsigned int volatile*	ioConfigAddress(unsigned int v)	{return((unsigned int volatile*)(0x40044000 | (v >> 24)));}
static unsigned int 			analogChannel(unsigned int v)	{return((v >> 12) & 0x7);}

static int pinID(unsigned int gpioID)
{
	if(gpioID < 0x200)	//GPIO pins 0.0 to 1.11 inclusive
	{
		return((gpioID & 0xFF) + (gpioID >> 8) * 12);
	}
	else
	{
		switch(gpioID)
		{
		case 0x200:	return(24);
		case 0x302:	return(25);
		case 0x304:	return(26);
		case 0x305:	return(27);
		}
	}
	return(-1);
}

int				IO::Pin::read(void)
{
	//if((v & 0xFF0000) == (IO::Pin::AnalogInput << 16))
	if((v >> 16) == IO::Pin::AnalogInput)
	{
		*LPC1300::ADCControl = (*LPC1300::ADCControl & ~0xFF00) | LPC1300::ADCControl_StartNow | analogChannel(v);
	}
	else
		return(*gpioAddress(v) != 0);
}
void			IO::Pin::write(int value)
{
	if((v >> 16) == IO::Pin::DigitalOutput)
		*gpioAddress(v) = (value != 0)? ~0 : 0;
}

//of a u32, bits 0-11 are gpio0.0-0.11, bits 12-23 are gpio1.0-1.11, bits 24-27 are gpio2.0, gpio3.2, gpio3.4, gpio3.5.	Bits 28-31 are undefined
enum
{
	PORT0 = (1 << 1),
	PORT1 = (1 << 12),
	PORT2_0 = (1 << 24),
	PORT3_2 = (1 << 25),
	PORT3_4 = (1 << 26),
	PORT3_5 = (1 << 27),
};

enum
{
	PIN_P0	= (PORT0 << 0),
	PIN_P1	= (PORT0 << 1),
	PIN_P2	= (PORT1 << 8),
	PIN_P3	= (PORT0 << 2),
	PIN_P4	= (PORT0 << 3),
	PIN_P5	= (PORT1 << 9),
	PIN_P6	= (PORT3_2),

	PIN_DP	= (PORT3_5),
	PIN_DM	= (PORT3_4),

	PIN_RTS	= (PORT1 << 5),
	PIN_CTS	= (PORT0 << 7),
	PIN_TXD	= (PORT1 << 7),
	PIN_RXD	= (PORT1 << 6),
	
	PIN_SCL	= (PORT0 << 4),
	PIN_SDA	= (PORT0 << 5),

	PIN_SCK	= (PORT0 << 6),
	PIN_SEL	= (PORT2_0),
	PIN_MISO =(PORT0 << 8),
	PIN_MOSI =(PORT0 << 9),

	PIN_A0	= (PORT0 << 11),
	PIN_A1	= (PORT1 << 0),
	PIN_A2	= (PORT1 << 1),
	PIN_A3	= (PORT1 << 2),
	PIN_A5	= (PORT1 << 4),
	PIN_A7	= (PORT1 << 11),
	
	PIN_LED	= (PORT1 << 10),
};

//0x02817800; 
//0x00000030; 
//0x01000340; 
//0x006D6B02; 
//0x000E0080;
//0x0C010003;

static unsigned int const kPinSupportsGPIO =	(0xFFFFFFF & ~(PIN_DP | PIN_DM));	//every pin except the USB ones
static unsigned int const kPinSupportsADC =		(PIN_A0 | PIN_A1 | PIN_A2 | PIN_A3 | PIN_A5 | PIN_A7); //0x02817800
static unsigned int const kPinSupportsI2C =		(PIN_SCL | PIN_SDA); //0x00000030
static unsigned int const kPinSupportsSPI =		(PIN_SCK | PIN_SEL | PIN_MISO | PIN_MOSI); //0x01000340
static unsigned int const kPinSupportsPWM =		(PIN_P1 | PIN_P5 | PIN_TXD | PIN_RXD | PIN_MISO | PIN_MOSI | PIN_A0 | PIN_A2 | PIN_A3 | PIN_A5 | PIN_LED); //0x006D6B02
static unsigned int const kPinSupportsUART =	(PIN_RTS | PIN_CTS | PIN_TXD | PIN_RXD); //0x000E0080
static unsigned int const kPinSupportsSpecial =	(PIN_P0 | PIN_P1 | PIN_DP | PIN_DM | PIN_A5);	//P0 is !reset, P1 is clkout, A5 is wakeup //0x0C010003

static unsigned int const kPinFunc1IsGPIO =		(PIN_P0 | PIN_A0 | PIN_A1 | PIN_A2 | PIN_A3);	//otherwise it's func 0		//0x00007801
static unsigned int const kPinFunc1IsADC =		(PIN_A5 | PIN_A7);		//otherwise it's func 2		//0x00810000
//I2C is always func 1
//SPI is always func 1 except for gpio0.6, where it's 2
static unsigned int const kPinFunc2IsPWM =		(PIN_P1 | PIN_MISO | PIN_MOSI | PIN_A5 | PIN_TXD | PIN_RXD | PIN_LED);	//otherwise it's func 3 except for gpio1.9 where it's 1		//0x004D0302
//UART is always func 1
//Special is always 1 except for gpio0.0 where it's 0

/*
#define pinTableEntry(registerOffset)	((registerOffset))
static unsigned char const pinDefaults[28] =
{
	pinTableEntry(0x0C),	//PinID(0, 0),	//2		P0
	pinTableEntry(0x10),	//PinID(0, 1),	//3		P1
	pinTableEntry(0x1C),	//PinID(0, 2),	//8		P3
	pinTableEntry(0x2C),	//PinID(0, 3),	//9		P4
	pinTableEntry(0x30),	//PinID(0, 4),	//10	SCL
	pinTableEntry(0x34),	//PinID(0, 5),	//11	SDA
	pinTableEntry(0x4C),	//PinID(0, 6),	//15	SCK
	pinTableEntry(0x50),	//PinID(0, 7),	//16	CTS
	pinTableEntry(0x60),	//PinID(0, 8),	//17	MISO
	pinTableEntry(0x64),	//PinID(0, 9),	//18	MOSI
	0,						//0,
	pinTableEntry(0x74),	//PinID(0, 11),	//21	A0
		
	pinTableEntry(0x78),	//PinID(1, 0),	//22	A1
	pinTableEntry(0x7C),	//PinID(1, 1),	//23	A2
	pinTableEntry(0x80),	//PinID(1, 2),	//24	A3
	0,						//0,
	pinTableEntry(0x94),	//PinID(1, 4),	//26	A5
	pinTableEntry(0xA0),	//PinID(1, 5),	//30	RTS
	pinTableEntry(0xA4),	//PinID(1, 6),	//31	RXD
	pinTableEntry(0xA8),	//PinID(1, 7),	//32	TXD
	pinTableEntry(0x14),	//PinID(1, 8),	//7		P2
	pinTableEntry(0x38),	//PinID(1, 9),	//12	P5
	pinTableEntry(0x6C),	//PinID(1, 10),	//20	LED (A6)
	pinTableEntry(0x98),	//PinID(1, 11),	//27	A7
	
	pinTableEntry(0x0C),	//PinID(2, 0),	//1		SEL
	
	pinTableEntry(0x9C),	//PinID(3, 2),	//28	P6
	pinTableEntry(0x3C),	//PinID(3, 4),	//13	USB D-
	pinTableEntry(0x48)		//PinID(3, 5),	//14	USB D+
							//4		XTALIN
							//5		XTALOUT
							//6		VDD
							//19	SWDCLK
							//25	SWDIO
							//29	VDD
};
*/

#define PIN_STATE(partSpecificData, pinMode, analogChannel, ioBank, pinNumber)		(((partSpecificData) << 24) | ((pinMode) << 16) | ((analogChannel) << 12) | ((ioBank) << 8) | ((pinNumber) << 0) )
unsigned int const kIOPinInitialState[26] =
{
	PIN_STATE(0x0C, IO::Pin::Reset, 0, 0, 0),			//P0
	PIN_STATE(0x10, IO::Pin::DigitalInput, 0, 0, 1),	//P1
	PIN_STATE(0x14, IO::Pin::DigitalInput, 0, 1, 8),	//P2
	PIN_STATE(0x1C, IO::Pin::DigitalInput, 0, 0, 2),	//P3
	PIN_STATE(0x2C, IO::Pin::DigitalInput, 0, 0, 3),	//P4
	PIN_STATE(0x38, IO::Pin::DigitalInput, 0, 1, 9),	//P5
	PIN_STATE(0x3C, IO::Pin::USB, 0, 3, 4),				//D-
	PIN_STATE(0x48, IO::Pin::USB, 0, 3, 5),				//D+
	PIN_STATE(0x9C, IO::Pin::DigitalInput, 0, 3, 2),	//P6

	PIN_STATE(0xA0, IO::Pin::DigitalInput, 0, 1, 5),	//RTS
	PIN_STATE(0x50, IO::Pin::DigitalInput, 0, 0, 7),	//CTS
	PIN_STATE(0xA8, IO::Pin::DigitalInput, 0, 1, 7),	//TXD
	PIN_STATE(0xA4, IO::Pin::DigitalInput, 0, 1, 6),	//RXD

	PIN_STATE(0x34, IO::Pin::DigitalInput, 0, 0, 5),	//SDA
	PIN_STATE(0x30, IO::Pin::DigitalInput, 0, 0, 4),	//SCL

	PIN_STATE(0x4C, IO::Pin::DigitalInput, 0, 0, 6),	//SCK
	PIN_STATE(0x0C, IO::Pin::DigitalInput, 0, 2, 0),	//SEL
	PIN_STATE(0x60, IO::Pin::DigitalInput, 0, 0, 8),	//MISO
	PIN_STATE(0x64, IO::Pin::DigitalInput, 0, 0, 9),	//MOSI

	PIN_STATE(0x74, IO::Pin::DigitalInput, 0, 0, 11),	//A0
	PIN_STATE(0x78, IO::Pin::DigitalInput, 1, 1, 0),	//A1
	PIN_STATE(0x7C, IO::Pin::DigitalInput, 2, 1, 1),	//A2
	PIN_STATE(0x80, IO::Pin::DigitalInput, 3, 1, 2),	//A3
	PIN_STATE(0x94, IO::Pin::DigitalInput, 5, 1, 4),	//A5
	PIN_STATE(0x98, IO::Pin::DigitalInput, 7, 1, 11),	//A7

	PIN_STATE(0x6C, IO::Pin::DigitalInput, 0, 1, 10),	//led
};

				IO::IO(void)
{
	*LPC1300::IOConfigSCKLocation = 2;	//put SCK0 on pin pio0.6

	Pin* p = &P0;
	for(int i = 0; i < 26; i++)
		*p++ = Pin(kIOPinInitialState[i]);
}


void			IO::Pin::setMode(Mode mode, Feature feature)
{
	unsigned int io = (v & 0xFFF);
	unsigned int id = pinID(io);
	unsigned int mask = (1 << id);

	if(id < 0)	return;	//not a valid pin
	
	unsigned int volatile* pinConfig = ioConfigAddress(v);

	switch(mode)
	{
	case IO::Pin::DigitalInput:
	case IO::Pin::DigitalOutput:
		{
			if(kPinSupportsGPIO & mask)
			{
				*pinConfig &= ~0x3;
				if(kPinFunc1IsGPIO & (1 << id))	*pinConfig |= 1;	//else mode is 0
				
				unsigned int bit = (1 << (v & 0xFF));
				if(mode == IO::Pin::DigitalOutput)
					*gpioDirAddress(v) |= bit;
				else
					*gpioDirAddress(v) &= ~bit;
			}
		}
		break;
	case IO::Pin::AnalogInput:
		if(kPinSupportsADC & mask)
		{
			*pinConfig &= ~0x3;
			*pinConfig |= ((kPinFunc1IsADC & (1 << id))? 1 : 2);
		}
		break;
	case IO::Pin::Reset:
		if(io == 0x000)	//only gpio0.0 has reset ability
		{
			*pinConfig &= ~0x3;
			//it so happens mode 0 is reset on gpio0.0, so leave it
		}
		break;
	case IO::Pin::SPI:
		if(kPinSupportsSPI & mask)
		{
			*pinConfig &= ~0x3;
			*pinConfig |= ((io == 0x006)? 2 : 1);
		}
		break;
	case IO::Pin::I2C:
		if(kPinSupportsI2C & mask)
		{
			*pinConfig &= ~0x3;
			*pinConfig |= 1;
		}
		break;
	case IO::Pin::UART:
		if(kPinSupportsUART & mask)
		{
			*pinConfig &= ~0x3;
			*pinConfig |= 1;
		}
		break;
	case IO::Pin::PWM:
		if(kPinSupportsPWM & mask)
		{
			*pinConfig &= ~0x3;
			if(io == 0x109)	*pinConfig |= 1;
			else			*pinConfig |= ((kPinFunc2IsPWM & (1 << id))? 2 : 3);
		}
		break;

	case IO::Pin::Manual:
	case IO::Pin::Default:
		break;
	}
}


void			IO::SPI::start(int bitRate, Role role, Mode mode)
{
	Galago::IO.SCK.setMode(IO::Pin::SPI);
	Galago::IO.MOSI.setMode(IO::Pin::SPI);
	Galago::IO.MISO.setMode(IO::Pin::SPI);

	*LPC1300::PeripheralnReset &= ~LPC1300::PeripheralnReset_SPI0;	//assert reset
	
	if(bitRate > 0)
	{
		*LPC1300::ClockControl |= LPC1300::ClockControl_SPI0;	//enable SPI0 clock
		*LPC1300::SPI0ClockPrescaler = 1;

		//@@solve this to get as close as possible to x in: bitRate = Fahb/2/x
		*LPC1300::SPI0ClockDivider = 6000000UL / bitRate;

		*LPC1300::SPI0Control0 = LPC1300::SPI0Control0_8BitTransfer | LPC1300::SPI0Control0_FrameFormat_SPI | LPC1300::SPI0Control0_SPIMode0;
		*LPC1300::SPI0Control1 = LPC1300::SPI0Control1_Enable;

		*LPC1300::PeripheralnReset |= LPC1300::PeripheralnReset_SPI0;	//deassert reset
	}
	else
		*LPC1300::ClockControl &= ~LPC1300::ClockControl_SPI0;	//disable SPI0 clock
}


void			IO::SPI::read(int length, byte* bytesReadBack, unsigned short writeChar)
{
	while(length-- > 0)
	{
		while(!(*LPC1300::SPI0Status & LPC1300::SPI0Status_ReceiveFIFONotEmpty));	//spinwait until the hardware can supply at least one datum
		
		*LPC1300::SPI0Data = (unsigned int)writeChar;	//append the character
		*bytesReadBack++ = (byte)*LPC1300::SPI0Data;
	}
}

void			IO::SPI::read(int length, unsigned short* bytesReadBack, unsigned short writeChar)
{
	while(length-- > 0)
	{
		while(!(*LPC1300::SPI0Status & LPC1300::SPI0Status_ReceiveFIFONotEmpty));	//spinwait until the hardware can supply at least one datum
		
		*LPC1300::SPI0Data = (unsigned int)writeChar;	//append the character
		*bytesReadBack++ = (unsigned short)*LPC1300::SPI0Data;
	}
}


void			IO::SPI::write(unsigned short h, int length)
{
	while(length-- > 0)
	{
		while(!(*LPC1300::SPI0Status & LPC1300::SPI0Status_TransmitFIFONotFull));	//spinwait until the hardware can fit at least one datum
		*LPC1300::SPI0Data = (unsigned int)h;	//append the same character
	}
}

void			IO::SPI::write(byte const* s, int length, byte* bytesReadBack)
{
	while(length-- > 0)
	{
		while(!(*LPC1300::SPI0Status & LPC1300::SPI0Status_TransmitFIFONotFull));	//spinwait until the hardware can fit at least one datum
		*LPC1300::SPI0Data = (unsigned int)*s++;	//append the next character
		if(bytesReadBack != 0)
			*bytesReadBack++ = (byte)*LPC1300::SPI0Data;
	}
}
void			IO::SPI::write(unsigned short const* s, int length, byte* bytesReadBack)
{
	while(length-- > 0)
	{
		while(!(*LPC1300::SPI0Status & LPC1300::SPI0Status_TransmitFIFONotFull));	//spinwait until the hardware can fit at least one datum
		*LPC1300::SPI0Data = (unsigned int)*s++;	//append the next character
		if(bytesReadBack != 0)
			*bytesReadBack++ = (byte)*LPC1300::SPI0Data;
	}
}

