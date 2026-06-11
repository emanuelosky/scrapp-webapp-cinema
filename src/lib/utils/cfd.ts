export interface SeatData {
    fila: number;
    columna: number;
    letra: string;
    nombre_butaca: string;
    id: string; // Fila-Columna-Sala
    status: 'libre' | 'ocupada' | 'seleccionada';
}

export interface RawSeat {
    filas?: string;
    columnas?: string;
    invertida?: string;
    tipoColumna?: string;
    fila?: string | number;
    columna?: string | number;
    letra?: string;
    libre?: string | number;
    seleccionada?: string | number;
    tipo_butaca_id?: string | number;
    butaca?: string | number;
    nombre_butaca?: string;
}

export type CFDCell = 
    | { type: 'empty' }
    | { type: 'row-label'; label: string }
    | { type: 'seat'; id: string; label: string; status: 'free' | 'taken' | 'selected'; seatType?: string };

export interface TaquillaResponse {
    maxFila: number;
    maxColumna: number;
    seats: SeatData[];
    matrix: CFDCell[][];
    available: number;
    taken: number;
    selectedSeats: string[];
    roomNumber: string;
}

export function parseButacasCFD(rawButacas: RawSeat[], sala: string, tipoButaca: string = '-1'): TaquillaResponse | null {
    if (!rawButacas || rawButacas.length === 0) return null;

    const filas = parseInt(rawButacas[0].filas || "0", 10);
    const columnas = parseInt(rawButacas[0].columnas || "0", 10);
    const invertidaCol = rawButacas[0].invertida === "1";
    const tipoCol = rawButacas[0].tipoColumna || "numeros";

    const getTags = (cant: number, inverted: boolean, type: string) => {
        let x: string[] = [];
        if (type === "letras") {
            let double = false;
            let firsLetter = 0;
            const begin = (!inverted) ? 0 : cant;
            const end = (!inverted) ? cant : 0;
            if (end > begin) {
                let pos = 0;
                for (let i = begin; i < end; i++) {
                    if (double) {
                        x.push(String.fromCharCode(65 + firsLetter) + String.fromCharCode(65 + pos));
                        pos++;
                    } else {
                        x.push(String.fromCharCode(65 + i));
                    }
                    double = (i >= 25);
                    if (pos > 25) { firsLetter++; pos = 0; }
                }
            } else {
                let pos = 25;
                for (let i = begin - 1; i >= end; i--) {
                    double = (i > 25);
                    if (pos < 0) { firsLetter++; pos = 25; }
                    if (double) {
                        x.push(String.fromCharCode(65 + firsLetter) + String.fromCharCode(65 + pos));
                        pos--;
                    } else {
                        x.push(String.fromCharCode(65 + i));
                    }
                }
            }
        } else {
            if (!inverted) {
                x = new Array(cant).fill(1).map((_, i) => (1 + i).toString());
            } else {
                x = new Array(cant).fill(1).map((_, i) => (cant - i).toString());
            }
        }
        return x;
    };

    const tagsColumns = getTags(columnas, invertidaCol, tipoCol).map(String);
    tagsColumns.unshift('0'); // dummy index 0

    const matrix: CFDCell[][] = [];
    const seats: SeatData[] = [];
    let available = 0;
    let taken = 0;
    const selectedSeats: string[] = [];

    // Fila 0 (Header/labels placeholder if needed)
    const emptyRow0: CFDCell[] = [];
    for (let j = 0; j <= columnas; j++) emptyRow0.push({ type: 'empty' });
    matrix.push(emptyRow0);

    for (let i = 1; i <= filas; i++) {
        const row: CFDCell[] = [];
        let rowLabelCaptured = "";

        for (let j = 0; j <= columnas; j++) {
            if (j === 0) {
                row.push({ type: 'row-label', label: '' });
            } else {
                const filaStr = String(i);
                const columnaTag = tagsColumns[j];
                const identificador = filaStr + "-" + columnaTag + "-" + filaStr;

                const rawMatch = rawButacas.find((r: RawSeat) =>
                    String(r.fila) + "-" + String(r.columna) + "-" + String(r.fila) === identificador
                );

                if (rawMatch) {
                    rowLabelCaptured = rawMatch.letra || rowLabelCaptured;

                    let status: 'libre' | 'ocupada' | 'seleccionada';
                    const esLibre = rawMatch.libre === '1';
                    const esSeleccionada = rawMatch.seleccionada === '1' || rawMatch.seleccionada === 1;
                    const esMismoTipo = tipoButaca === '-1' || rawMatch.tipo_butaca_id === tipoButaca;

                    if (esLibre && esMismoTipo) {
                        status = 'libre';
                    } else if (!esLibre && esSeleccionada) {
                        status = 'seleccionada';
                    } else {
                        status = 'ocupada';
                    }

                    const seatId = rawMatch.butaca
                        ? String(rawMatch.butaca)
                        : `${rawMatch.letra || ''}-${rawMatch.columna}-${sala}`;

                    seats.push({
                        fila: i,
                        columna: j,
                        letra: rawMatch.letra || '',
                        nombre_butaca: rawMatch.nombre_butaca || String(rawMatch.columna),
                        id: seatId,
                        status
                    });

                    row.push({
                        type: 'seat',
                        id: seatId,
                        label: rawMatch.nombre_butaca || String(rawMatch.columna),
                        status: status === 'libre' ? 'free' : (status === 'seleccionada' ? 'selected' : 'taken')
                    });

                    if (status === 'libre') available++;
                    else if (status === 'ocupada') taken++;
                    else if (status === 'seleccionada') selectedSeats.push(seatId);
                } else {
                    row.push({ type: 'empty' });
                }
            }
        }
        
        // El label se setea en la celda inicial
        if (row[0].type === 'row-label') {
            row[0].label = rowLabelCaptured || String.fromCharCode(64 + i); // Fallback to A,B,C
        }
        matrix.push(row);
    }

    return {
        maxFila: filas,
        maxColumna: columnas,
        seats,
        matrix,
        available,
        taken,
        selectedSeats,
        roomNumber: sala
    };
}
