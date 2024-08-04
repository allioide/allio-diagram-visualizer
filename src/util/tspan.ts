import {Tspan} from '@svgdotjs/svg.js';

declare module '@svgdotjs/svg.js' {
  interface Tspan {
    newline(enable: boolean): Tspan;
  }
}

Tspan.prototype.newline = function (enable) {
  if (enable) {
    this.newLine();
  }

  return this;
};
