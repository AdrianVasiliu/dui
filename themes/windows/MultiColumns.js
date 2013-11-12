define(function(){ return '\
.duiToolBarButtonHasArrow-styles {\
  width: 27px;\
  height: 27px;\
  border-radius: 20px;\
  border: 2px solid #ffffff;\
  padding: 0px;\
  margin: 0px;\
  margin-top: 8px;\
  margin-bottom: 8px;\
  background-image: url("images/dark/back.png");\
  background-position: 50% 50%;\
  background-size: 27px 27px;\
  background-repeat: no-repeat;\
}\
.duiMultiColumns {\
  overflow: hidden;\
}\
@media screen and (max-width: 501px) {\
  .duiMultiColumns > .duiBasicLayout {\
    width: 500%;\
  }\
  .duiMultiColumns > .duiBasicLayout.pos1 {\
    -webkit-transform: translate3d(-20%, 0px, 0px);\
    transform: translate3d(-20%, 0px, 0px);\
  }\
  .duiMultiColumns > .duiBasicLayout.pos2 {\
    -webkit-transform: translate3d(-40%, 0px, 0px);\
    transform: translate3d(-40%, 0px, 0px);\
  }\
  .duiMultiColumns > .duiBasicLayout.pos3 {\
    -webkit-transform: translate3d(-60%, 0px, 0px);\
    transform: translate3d(-60%, 0px, 0px);\
  }\
  .duiMultiColumns > .duiBasicLayout.pos4 {\
    -webkit-transform: translate3d(-80%, 0px, 0px);\
    transform: translate3d(-80%, 0px, 0px);\
  }\
  .duiMultiColumns > .duiBasicLayout.pos5 {\
    -webkit-transform: translate3d(-100%, 0px, 0px);\
    transform: translate3d(-100%, 0px, 0px);\
  }\
}\
@media screen and (min-width: 501px) and (max-width: 801px) {\
  .duiMultiColumns > .duiBasicLayout {\
    width: 125%;\
  }\
  .duiMultiColumns > .duiBasicLayout.pos1 {\
    -webkit-transform: translate3d(-20%, 0px, 0px);\
    transform: translate3d(-20%, 0px, 0px);\
  }\
  .duiMultiColumns > .duiBasicLayout.pos2 {\
    -webkit-transform: translate3d(-40%, 0px, 0px);\
    transform: translate3d(-40%, 0px, 0px);\
  }\
}\
@media screen and (min-width: 801px) {\
  .duiMultiColumns > .duiBasicLayout {\
    width: 100%;\
  }\
  .duiMultiColumns > .duiBasicLayout.pos1 {\
    -webkit-transform: translate3d(-20%, 0px, 0px);\
    transform: translate3d(-20%, 0px, 0px);\
  }\
}\
'; } );