define(function(){ return '\
.duiViewStack {\
  box-sizing: border-box !important;\
  overflow-x: hidden !important;\
  overflow-y: hidden;\
  position: relative !important;\
}\
.duiBasicLayout > .duiViewStack {\
  display: block !important;\
}\
.duiViewStack > * {\
  position: absolute !important;\
  box-sizing: border-box !important;\
  width: 100% !important;\
  height: 100% !important;\
}\
'; } );
