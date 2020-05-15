import { ParserMessage } from "../../parser/ParserMessage";
import { TSDocMessageId } from "../../parser/TSDocMessageId";
import { TextRange } from "../../parser/TextRange";

export interface IMessageNode {
    readonly message: ParserMessage;
    readonly previous: IMessageNode | undefined;
}

export class ParserMessageLog {
    private _tail: IMessageNode | undefined;
    private _messageCache: ParserMessage[] | undefined;
    private _messageCacheTail: IMessageNode | undefined;

    constructor(tail?: IMessageNode) {
        this._tail = tail;
    }

    public get tail(): IMessageNode | undefined {
        return this._tail;
    }

    public set tail(value: IMessageNode | undefined) {
        this._tail = value;
    }

    public reportError(messageId: TSDocMessageId, messageText: string, buffer: string, pos: number, end: number): void {
        if (pos < 0) pos = 0;
        if (end < pos) end = pos;
        if (pos > buffer.length) pos = buffer.length;
        if (end > buffer.length) end = buffer.length;
        this._tail = {
            message: new ParserMessage({
                messageId,
                messageText,
                textRange: TextRange.fromStringRange(buffer, pos, end),
            }),
            previous: this._tail
        };
    }

    public toArray(): ReadonlyArray<ParserMessage> {
        if (!this._messageCache || this._messageCacheTail !== this._tail) {
            const messages: ParserMessage[] = [];
            for (let node: IMessageNode | undefined = this._tail; node; node = node.previous) {
                messages.unshift(node.message);
            }
            this._messageCache = messages;
            this._messageCacheTail = this._tail;
        }
        return this._messageCache;
    }
}