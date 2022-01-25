import { StringDecoder } from 'string_decoder';

export class LineDecoder {
	private stringDecoder: StringDecoder;
	private remaining: string | null;

	constructor(encoding: BufferEncoding = 'utf8') {
		this.stringDecoder = new StringDecoder(encoding);
		this.remaining = null;
	}

	public write(buffer: Buffer): string[] {
		let result: string[] = [];
		let value = this.remaining
			? this.remaining + this.stringDecoder.write(buffer)
			: this.stringDecoder.write(buffer);

		if (value.length < 1) {
			return result;
		}
		let start = 0;
		let ch: number;
		while (start < value.length && ((ch = value.charCodeAt(start)) === 13 || ch === 10)) {
			start++;
		}
		let idx = start;
		while (idx < value.length) {
			ch = value.charCodeAt(idx);
			if (ch === 13 || ch === 10) {
				result.push(value.substring(start, idx));
				idx++;
				while (idx < value.length && ((ch = value.charCodeAt(idx)) === 13 || ch === 10)) {
					idx++;
				}
				start = idx;
			} else {
				idx++;
			}
		}
		this.remaining = start < value.length ? value.substr(start) : null;
		return result;
	}

	public end(): string | null {
		return this.remaining;
	}
}
