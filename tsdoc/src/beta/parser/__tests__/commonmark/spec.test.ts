import { BlockParser } from "../../BlockParser";
import { Document } from "../../../nodes/Document";
import { render } from "./renderer";
import { SnapshotSerializer } from "../serializers";

expect.addSnapshotSerializer(SnapshotSerializer.serializer);

declare const require: any;

const onlySections: Set<string> = new Set([]);
const skipSections: Set<string> = new Set([]);
const onlyExamples: Set<number> = new Set([]);
const skipExamples: Set<number> = new Set([]);

interface Test {
    markdown: string;
    html: string;
    example: number;
    start_line: number;
    end_line: number;
    section: string;
}

function groupBySection(tests: Test[]): [string, Test[]][] {
    const groups: Map<string, Test[]> = new Map();
    const sections: [string, Test[]][] = [];
    for (const test of tests) {
        let section: Test[] | undefined = groups.get(test.section);
        if (!section) {
            section = [];
            groups.set(test.section, section);
            sections.push([test.section, section]);
        }
        section.push(test);
    }
    return sections;
}

const allTests: Test[] = require("../../../../../scripts/spec.json");
for (const [section, tests] of groupBySection(allTests)) {
    (onlySections.has(section) ? describe.only :
        skipSections.has(section) ? describe.skip :
        describe)(section, () => {
        for (const test of tests) {
            (onlyExamples.has(test.example) ? it.only :
                skipExamples.has(test.example) ? it.skip :
                it)(`<https://spec.commonmark.org/0.29/#example-${test.example}>`, () => {
                const parser: BlockParser = new BlockParser(test.markdown);
                const document: Document = parser.parse();
                const actual: string = render(document);
                expect(actual).toBe(test.html);
                expect(document).toMatchSnapshot();
            });
        }
    });
}