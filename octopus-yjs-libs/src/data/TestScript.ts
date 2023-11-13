import { OctopusScript, OctopusScriptElementType} from "../types/OctopusScript"

const dummyScript: OctopusScript = {
    version: 1,
    body: [{
        type: OctopusScriptElementType.STUDIO,
        label: "ŠTÚDIO",
        elid: 0,
        content: [
            {
                type: 'text',
                text: 'OBYC TEXT '
            },
            {
                type: 'text',
                bold: true,
                text: 'BOLD TEXT '
            },
            {
                type: 'tag',
                foreground: "#FF0000",
                background: "#000000",
                text: 'THIS IS A TAG'
            },
            {
                type: 'text',
                italic: true,
                text: ' ITALIC TEXT \nON 2 LINES'
            },
            {
                type: 'cg',
                cmdId: 12345,
                in: 0,
                out: 0,
                lines: ["line 1", "line 2"]    
            },
            {
                type: 'text',
                text: ' Well, those were some CGs.'
            },
            {
                type: 'text',
                underline: true,
                text: ' Now we\'ll hear whar user_12345 has to say.'
            },
            {
                type: 'pres',
                user: {
                    globalId: "user_12345",
                    id: 12345,
                    modified: new Date().getTime(),
                    objectType: "user",
                }
            },
            {
                type: 'text',
                text: ' Thanks Karen, but I have nothing.'
            },
            {
                type: 'note',
                text: ' THIS IS A TECHNICAL NOTE'
            },
            {
                type: 'text',
                text: ' Except for this MOS Object.'
            },
            {
                type: 'mos',
                cmdId: 12345,
                in: 0,
                out: 0,
                object: {
                    objectId: 23456,
                    mosId: "Astra",
                    objId: "AstraSeNeflaka12345"
                }   
            }
        ]
    }]
};

export function getTestScript(): OctopusScript {
    return dummyScript;
}