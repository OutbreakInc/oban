#include <lpc13xx.h>

using namespace LPC1300;

int main()
{
  int derp = 0;

  while (true)
    {
      *GPIO2 = ++derp;
    }

  return 0;
}
