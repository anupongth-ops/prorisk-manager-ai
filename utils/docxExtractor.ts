/**
 * Utility to extract clean plain text from Word (.docx) documents in the browser
 * Using standard Web APIs (ArrayBuffer, DataView, and DecompressionStream)
 */

export async function extractTextFromDocxFile(file: File): Promise<string> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        const dataView = new DataView(arrayBuffer);

        let offset = 0;
        while (offset < buffer.length - 4) {
            // Check ZIP Local File Header magic number (0x04034b50 -> 'PK\x03\x04')
            if (
                buffer[offset] === 0x50 &&
                buffer[offset + 1] === 0x4b &&
                buffer[offset + 2] === 0x03 &&
                buffer[offset + 3] === 0x04
            ) {
                const compression = dataView.getUint16(offset + 8, true);
                const compressedSize = dataView.getUint32(offset + 18, true);
                const fileNameLength = dataView.getUint16(offset + 26, true);
                const extraFieldLength = dataView.getUint16(offset + 28, true);

                const fileNameBytes = buffer.subarray(offset + 30, offset + 30 + fileNameLength);
                const fileName = new TextDecoder().decode(fileNameBytes);
                const dataOffset = offset + 30 + fileNameLength + extraFieldLength;

                if (fileName === 'word/document.xml') {
                    const compressedData = buffer.subarray(dataOffset, dataOffset + compressedSize);

                    let xmlText = '';
                    if (compression === 8) {
                        // Deflate compression
                        try {
                            const ds = new DecompressionStream('deflate-raw');
                            const writer = ds.writable.getWriter();
                            writer.write(compressedData);
                            writer.close();

                            const reader = ds.readable.getReader();
                            const chunks: Uint8Array[] = [];
                            while (true) {
                                const { value, done } = await reader.read();
                                if (done) break;
                                if (value) chunks.push(value);
                            }

                            const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
                            const merged = new Uint8Array(totalLen);
                            let pos = 0;
                            for (const chunk of chunks) {
                                merged.set(chunk, pos);
                                pos += chunk.length;
                            }
                            xmlText = new TextDecoder().decode(merged);
                        } catch (decompErr) {
                            console.warn('DecompressionStream error:', decompErr);
                        }
                    } else if (compression === 0) {
                        xmlText = new TextDecoder().decode(compressedData);
                    }

                    if (xmlText) {
                        return cleanWordXmlToText(xmlText);
                    }
                }

                offset = dataOffset + compressedSize;
            } else {
                offset++;
            }
        }
    } catch (err) {
        console.error('Failed to extract text from docx:', err);
    }

    return '';
}

function cleanWordXmlToText(xml: string): string {
    return xml
        .replace(/<\/w:p>/g, '\n')
        .replace(/<w:tab\/>/g, '\t')
        .replace(/<w:br\/>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/\n\s*\n/g, '\n')
        .trim();
}
