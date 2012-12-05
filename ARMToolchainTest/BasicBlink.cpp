#include "lpc13xx.h"

using namespace LPC1300;

static unsigned int const LED = (1 << 10);

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
