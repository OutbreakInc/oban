void	intToBCD(char* out, byte wholeDigits, byte fracDigits, int i, byte offset)
{
	byte q;
	int whole = i >> FIXED_SHIFT;
	
	for(q = 0; whole >= 1000; whole -= 1000) q++;
	if(wholeDigits >= 4)
		*out++ = offset + q;
	for(q = 0; whole >= 100; whole -= 100) q++;
	if(wholeDigits >= 3)
		*out++ = offset + q;
	for(q = 0; whole >= 10; whole -= 10) q++;
	if(wholeDigits >= 2)
		*out++ = offset + q;
	if(wholeDigits >= 1)
		*out++ = offset + whole;
	
	if(offset)
		*out++ = '.';

	while((fracDigits-- > 0))
	{
		i &= ((1 << FIXED_SHIFT) - 1);
		i = (i << 3) + (i << 1);
		*out++ = offset + (i >> FIXED_SHIFT);
	}
}

byte const gDigits[] PROGMEM=
{
	0x7E,	//0	-ABC DEF-
	0x30,	//1	--BC ----
	0x6D,	//2	-AB- DE-G
	0x79,	//3	-ABC D--G
	0x33,	//4	--BC --FG
	0x5B,	//5	-A-C D-FG
	0x5F,	//6	-A-C DEFG
	0x72,	//7	-ABC --F-
	0x7F,	//8	-ABC DEFG
	0x7B,	//9	-ABC D-FG
	0x01,	//-	---- ---G
};

class TemperatureApp: Object
{
public:
	TemperatureApp()
	{
		digitIndex = 0;
		counter = 0;

		System.Scheduler.addRecurringTask(1000, &onTimer, this);
	}

private:
	void	setLEDDigit(byte digit, byte value)
	{
		//deassert shift register's latch
		IO.P5 = 1;

		//separate the decimal place indicator
		byte v = value & 0x0F;
		value &= 0x80;

		//shift new digit, ORing in the decimal place indicator
		IO.SPI.write(value | gDigits[v]));
		
		//latch the digit
		IO.P1 = IO.P2 = IO.P3 = IO.P4 = 1;	//disable column sinks
		IO.P5 = 0;	//assert shift register's latch
		IO.P[1 + digit] = 0;	//sink the right column
	}


	void	takeSample()
	{
		int celsius = IO.A0.sample();

		celsius >>= 1;
		
		sample -= 2099;		//remove constant term
		sample *= 105;		//remove linear term
		
		//celsius is now in 8.8 fixed format
		
		byte decimalPoint = 0;
		if(celsius >= 0x8000)
		{
			digits[0] = 10;	//'-'
			if(celsius < 0x9C00)
			{
				intToBCD(digits + 1, 3, 0, -celsius, 0);
			}
			else
			{
				intToBCD(digits + 1, 2, 1, -celsius, 0);
				digits[2] |= 0x80;	//-00.0
			}
		}
		else if(celsius < 0x6400)
		{
			intToBCD(digits, 2, 2, celsius, 0);
			digits[1] |= 0x80;	//00.00
		}
		else
		{
			intToBCD(digits, 3, 1, celsius, 0);
			digits[2] |= 0x80;	//000.0
		}
	}

	static void		onTimer(Ref r)
	{
		((TemperatureApp*) *r)->onTimer();
	}

	void			onTimer()
	{
		setLEDDigit(digitIndex, digits[digitIndex]);

		digitIndex = (digitIndex + 1) & 3;	//scan across all four digits
		
		//after 50 cycles and between full refreshes (when digitIndex == 0), sample the temperature again
		if((++counter > 50) && (digitIndex == 0))
		{
			counter = 0;
			takeSample();
		}
	}

	byte	digits[4];
	int		digitIndex;
	int		counter;
};

int main()
{
	TemperatureApp a;
}
