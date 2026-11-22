// AERO's supplied wordmark is vector lettering. Reuse its A and P bowl
// geometry, with matching 280-unit caps and heavy strokes for G, M and U.
export const wordmarkViewBox='0 0 1651 450';
export const wordmarkLetters=[
 {letter:'G',x:0,d:'M240 90H163C159 78 144 74 120 74C91 74 78 97 78 140S91 206 120 206C140 206 155 202 166 196V177H121V116H240V238C211 266 170 280 120 280C42 280 0 225 0 140S42 0 120 0C189 0 229 34 240 90Z'},
 {letter:'A',x:266,d:'M0 280 85 0h82l85 280h-80l-13-49H91l-13 49ZM108 166h35l-17-72Z'},
 {letter:'A',x:544,d:'M0 280 85 0h82l85 280h-80l-13-49H91l-13 49ZM108 166h35l-17-72Z'},
 {letter:'M',x:822,d:'M0 280V0H88L150 139L212 0H300V280H222V137L177 239H123L78 137V280Z'},
 {letter:'U',x:1148,d:'M0 0H78V172C78 196 91 206 120 206S162 196 162 172V0H240V174C240 244 198 280 120 280S0 244 0 174Z'},
 {letter:'P',x:1414,d:'M0 280V0H129C203 0 237 34 237 89S203 178 129 178H78V280ZM78 70V108H124C148 108 158 101 158 89S148 70 124 70Z'},
];
export const propertiesLabel={x:825.5,y:425,fontFamily:'Arial,sans-serif',fontSize:112,fontWeight:700,letterSpacing:12,textLength:1050};
export function heroMaskSvg(){
 const paths=wordmarkLetters.map(({x,d})=>`<path transform="translate(${x} 0)" fill-rule="evenodd" d="${d}"/>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${wordmarkViewBox}"><g fill="white">${paths}<text x="${propertiesLabel.x}" y="${propertiesLabel.y}" text-anchor="middle" font-family="${propertiesLabel.fontFamily}" font-size="${propertiesLabel.fontSize}" font-weight="${propertiesLabel.fontWeight}" letter-spacing="${propertiesLabel.letterSpacing}" textLength="${propertiesLabel.textLength}" lengthAdjust="spacingAndGlyphs">PROPERTIES</text></g></svg>\n`;
}
