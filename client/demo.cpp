#include <lpc13xx.h>

using namespace LPC1300;

/*
int main(void)
{
	*ClockControl |= ClockControl_Timer16_0;
	*InterruptEnableSet1 |= (1 << 7);	//enable Timer16_0 interrupt
	
	*Timer0PrescalerCounter = 0;
	*Timer0Prescaler = 12000;	//increment the timer every mS (assuming the CPU runs at 12MHz)
	*Timer0Match0 = 900;		//fire at 900ms
	*Timer0Match1 = 1000;		//fire at 1000ms (and restart timer here)
	
	*Timer0MatchControl =	(1 << (3 * 0)) |	//interrupt on match 0
							(1 << (3 * 1)) |	//interrupt on match 1
							(2 << (3 * 1));		//reset on match 1
	
	*Timer0Control = (1);	//reset
	*Timer0Control = (0);	//!reset, enable
	
	*GPIO1Dir = (1 << 10);	//onboard LED is an output
	
	GPIO1[1 << 10] = (1 << 10);		//active low
	
	InterruptsEnable();			//global interrupts enabled
	
	while(1)	_Sleep();		//interrupt service loop
}

void IRQ_Timer16_0(void)
{
	if(*Timer0Interrupts & (1 << 0))
	{
		*Timer0Interrupts |= (1 << 0);
		GPIO1[1 << 10] = (0 << 10);		//assert onboard LED
	}
	else if(*Timer0Interrupts & (1 << 1))
	{
		*Timer0Interrupts |= (1 << 1);
		GPIO1[1 << 10] = (1 << 10);		//release onboard LED
	}
}
*/

int main(void)
{
	*GPIO1Dir = (1 << 10);	//onboard LED is an output
	while(true)
	{
		for(int i = 0; i < (6000000L / 4); i++) asm volatile("nop");
		GPIO1[1 << 10] = (0);		//on
		for(int i = 0; i < (6000000L / 4); i++) asm volatile("nop");
		GPIO1[1 << 10] = (1 << 10);		//off
	}
}
