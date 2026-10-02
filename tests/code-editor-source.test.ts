import test from 'node:test';
import assert from 'node:assert/strict';
import * as sourceModule from '../src/code-editor/source';
const {applySourceChanges}=sourceModule;

test('loading without edits preserves mixed CRLF, LF, CR and Unicode source bytes',()=>{
 const source='\tA😀\r\n界\n  B\rC\r\n';
 for(const eol of ['\n','\r\n'])assert.equal(applySourceChanges(source,eol,[]),source);
});
test('inserting source preserves existing mixed line endings for either Monaco model EOL',()=>{
 const source='A\r\nB\nC\rD';
 assert.equal(applySourceChanges(source,'\n',[{rangeOffset:2,rangeLength:0,text:'X'}]),'A\r\nXB\nC\rD');
 assert.equal(applySourceChanges(source,'\r\n',[{rangeOffset:3,rangeLength:0,text:'X'}]),'A\r\nXB\nC\rD');
});
test('deletions spanning source line breaks remove exactly the model range',()=>{
 const source='A\r\nB\nC\rD';
 assert.equal(applySourceChanges(source,'\n',[{rangeOffset:1,rangeLength:4,text:''}]),'A\rD');
 assert.equal(applySourceChanges(source,'\r\n',[{rangeOffset:1,rangeLength:6,text:''}]),'A\rD');
});
test('offsets count UTF16 code units without splitting unchanged nonBMP source',()=>{
 const source='A😀\r\n界\nB\rC';
 assert.equal(applySourceChanges(source,'\n',[{rangeOffset:4,rangeLength:1,text:'été'}]),'A😀\r\nété\nB\rC');
 assert.equal(applySourceChanges(source,'\n',[{rangeOffset:1,rangeLength:2,text:'🦋'}]),'A🦋\r\n界\nB\rC');
});
test('multiple nonoverlapping changes use original model offsets regardless of order',()=>{
 const source='A\r\nB\nC\rD';
 const changes=[{rangeOffset:2,rangeLength:1,text:'long'},{rangeOffset:6,rangeLength:0,text:'界😀'}];
 assert.equal(applySourceChanges(source,'\n',changes),'A\r\nlong\nC\r界😀D');
 assert.equal(applySourceChanges(source,'\n',[...changes].reverse()),'A\r\nlong\nC\r界😀D');
});
test('newly inserted line breaks use Monaco change text without normalizing existing source',()=>{
 assert.equal(applySourceChanges('A\r\nB\nC\rD','\r\n',[{rangeOffset:3,rangeLength:0,text:'new\r\n'}]),'A\r\nnew\r\nB\nC\rD');
});
test('exact undo source history rejects snapshots beyond its byte budget',()=>{
 assert.equal(typeof sourceModule.SourceHistory,'function');
 const history=new sourceModule.SourceHistory(140);
 assert.equal(history.retain(1,'abc'),true); // UTF16 source plus bounded entry cost.
 assert.equal(history.retain(2,'de'),true);
 assert.equal(history.retain(3,''),false,'even empty snapshots have a bounded entry cost');
 assert.equal(history.get(1),'abc');assert.equal(history.get(3),undefined);
 assert.equal(history.retain(1,'x'),true,'replacing an entry releases its previous bytes');
 assert.equal(history.retain(3,'😀'),false);
 history.clear();
 assert.equal(history.get(1),undefined);assert.equal(history.retain(3,'😀'),true);
 assert.equal(history.retain(4,'x'.repeat(39)),false,'oversized sources cannot enter the exact history');
});
test('basic textarea no-edit and single edits preserve original mixed line endings',()=>{
 assert.equal(typeof sourceModule.applyBasicInput,'function');
 const source='A😀\r\n界\nB\rC';
 assert.equal(sourceModule.applyBasicInput(source,'A😀\n界\nB\nC'),source);
 assert.equal(sourceModule.applyBasicInput(source,'A😀\nX界\nB\nC'),'A😀\r\nX界\nB\rC');
 assert.equal(sourceModule.applyBasicInput(source,'A😄\n界\nB\nC'),'A😄\r\n界\nB\rC');
 assert.equal(sourceModule.applyBasicInput(source,'A😀\nC'),'A😀\r\nC');
 assert.equal(sourceModule.applyBasicInput(source,'A😀\n界\nnew\nB\nC'),'A😀\r\n界\nnew\nB\rC');
 assert.equal(sourceModule.applyBasicInput(source,''),'');
});
test('an explicit stripped-BOM projection preserves the original prefix across model edits',()=>{
 const source='\uFEFFA😀\r\n界\nB\rC';
 assert.equal(applySourceChanges(source,'\n',[{rangeOffset:0,rangeLength:0,text:'X'}],1),'\uFEFFXA😀\r\n界\nB\rC');
 assert.equal(applySourceChanges(source,'\n',[{rangeOffset:0,rangeLength:1,text:''}],1),'\uFEFF😀\r\n界\nB\rC');
 const modelLength=source.slice(1).replace(/\r\n|\r/g,'\n').length;
 assert.equal(applySourceChanges(source,'\n',[{rangeOffset:0,rangeLength:modelLength,text:'<p>new</p>'}],1),'\uFEFF<p>new</p>');
 assert.equal(applySourceChanges(source,'\n',[{rangeOffset:0,rangeLength:0,text:'X'}]),'X'+source,'default projection keeps BOM editable for basic mode');
 assert.equal(sourceModule.applyBasicInput(source,'X'+source.replace(/\r\n|\r/g,'\n')),'X'+source);
});
