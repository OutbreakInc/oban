#include <lpc11xx.h>

using namespace LPC1100;

int main(void)
{
	System::SystemControl->peripheralClocks.clockControl |= System::_LPC1100_PeripheralClockControl::Timer16_0Clock;		//enable the clock to Timer16_0
	//Timer::Timer16_0->prescalerCurrentValue = 1;					//1:1 with APB clock
	Interrupt::InterruptsEnabledSet->irqTimer16_0 = 1;				//enable interrupts from Timer16_0
	
	Timer::Timer16_0->prescalerMatchValue = 12000;	//increment the timer every mS (assuming the CPU runs at 12MHz)
	Timer::Timer16_0->match0Value = 900;			//fire at 900ms
	Timer::Timer16_0->match1Value = 1000;			//fire at 1000ms (and restart timer here)
	Timer::Timer16_0->matchControl.rawValue = (		TIMER_MATCH_m_CONTROL_FLAG_INTERRUPT(0) |	//interrupt on match 0
													TIMER_MATCH_m_CONTROL_FLAG_INTERRUPT(1) |	//interrupt on match 1
													TIMER_MATCH_m_CONTROL_FLAG_RESET(1)			//reset on match 1
												);
	
	Timer::Timer16_0->control.rawValue = (TIMER_CONTROL_FLAG_RESET);	//reset
	Timer::Timer16_0->control.rawValue = (TIMER_CONTROL_FLAG_ENABLE);	//!reset, enable
	
	GPIO_1_DIR = _BIT(8);	//pin is an output
	GPIO_1_DATA_MASKED(_BIT(8)) = 0;
	
	InterruptsEnable();			//global interrupts enabled
	
	while(1)	_Sleep();		//interrupt service loop
}

void IRQ_Timer16_0(void)
{
	if(Timer::Timer16_0->interruptsRaised.IsRaised(Timer::LPC1100_Timer_InterruptStatus::Interrupt_Match0))
	{
		Timer::Timer16_0->interruptsRaised.Clear(Timer::LPC1100_Timer_InterruptStatus::Interrupt_Match0);
		GPIO_1_DATA_MASKED(_BIT(8)) = ~0;	//illuminate gpio1_8 (status LED)
	}
	else if(Timer::Timer16_0->interruptsRaised.IsRaised(Timer::LPC1100_Timer_InterruptStatus::Interrupt_Match1))
	{
		Timer::Timer16_0->interruptsRaised.Clear(Timer::LPC1100_Timer_InterruptStatus::Interrupt_Match1);
		GPIO_1_DATA_MASKED(_BIT(8)) = 0;	//extinguish gpio1_8 (status LED)
	}
}
