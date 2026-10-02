export type CodeEditorOptions={value:string;readOnly:boolean;label:string};
export type CodeEditorHandle={getValue:()=>string;setValue:(value:string)=>void;setReadOnly:(readOnly:boolean)=>void;focus:()=>void;dispose:()=>void};
export type CodeEditorModule={create:(container:HTMLElement,options:CodeEditorOptions,onChange:(value:string)=>void)=>CodeEditorHandle};
export type CodeEditorManifest={schema_version:1;version:'0.57.0';asset_base:string;module:string;stylesheet:string;editor_worker:string;html_worker:string};
