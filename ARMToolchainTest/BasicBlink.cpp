#include "lpc13xx.h"
#include "GalagoAPI.h"

//using namespace LPC1300;
using namespace Galago;

//static unsigned int const LED = (1 << 10);

/*
int main(void)
{
	*IOConfigPIO1_10 = IOConfigPIO1_10_Function_PIO | IOConfigPIO1_10_PullUp | IOConfigPIO1_10_DigitalMode;
	*GPIO1Dir = LED;
	
	while(true)
	{
		*GPIO1Data |= LED;
		
		for(int i = 0; i < 1000000; i++)
			__asm__("nop");
		
		*GPIO1Data &= ~LED;
		
		for (int i = 0; i < 1000000; i++)
			__asm__("nop");
	}
}
*/
	
/*
int main(void)
{
	IO.led.setOutput();
	
	while(true)
	{
		IO.led.write(1);
		
		for(int i = 0; i < 1000000; i++)
			__asm__("nop");
		
		IO.led.write(0);
		
		for(int i = 0; i < 1000000; i++)
			__asm__("nop");
	}
}
*/

int $defaultEmitPeriod = 1000;

struct NumberEmitter
{
	int		counter;
	
	NumberEmitter(void)
	{
		counter = 0;
		System.addTimedTask($defaultEmitPeriod, onTimer, this);
	}
	
	static void	onTimer(void* s)
	{
		NumberEmitter* self = (NumberEmitter*)s;
		IO.spi.write((byte)self->counter++);
	}
};

int main(void)
{
	IO.spi.start(2000000, IO::SPI::Master);	//2MHz master, mode 0
	
	NumberEmitter job;
	
	while(true)
		System.sleep();
}
