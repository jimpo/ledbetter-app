import {parseCode} from './layout';


test('parseCode', () => {
	const results = parseCode("foo\n");
	expect(results).toEqual([[[[[ "foo" ],"\n" ]]]]);
});
