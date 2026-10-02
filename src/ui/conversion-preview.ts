import {parse,serialize,type DefaultTreeAdapterTypes} from 'parse5';

// Preview-only transformation: saved source, proposal and hashes stay untouched.
// Parse as a browser document so duplicate/encoded/repaired attributes cannot
// leave a navigable anchor behind. The empty iframe sandbox remains mandatory.
export function conversionPreview(html:string):string {
 const tree=parse(html),stack:DefaultTreeAdapterTypes.Node[]=[tree];
 while(stack.length){const node=stack.pop()!;
  if('tagName'in node){
   if(node.tagName==='a'||node.tagName==='area'){
    const linked=node.attrs.some(attr=>attr.name==='href');
    node.attrs=node.attrs.filter(attr=>!['href','target','ping','download','tabindex'].includes(attr.name));
    if(linked)node.attrs.push({name:'data-conversion-inert-link',value:''});
    node.attrs.push({name:'tabindex',value:'-1'},{name:'aria-disabled',value:'true'});
   }
   if(node.tagName==='meta'&&node.attrs.some(attr=>attr.name==='http-equiv'&&attr.value.toLowerCase()==='refresh'))node.attrs=[];
  }
  if('childNodes'in node)for(const child of node.childNodes)stack.push(child);
  if('content'in node)stack.push(node.content);
 }
 return '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src \'none\'; style-src \'unsafe-inline\'; font-src \'none\'; base-uri \'none\'; form-action \'none\'"><style>html,body{max-width:100%;overflow-wrap:anywhere}img,table{max-width:100%}a[data-conversion-inert-link]{color:#0000ee;text-decoration:underline}</style>'+serialize(tree);
}
