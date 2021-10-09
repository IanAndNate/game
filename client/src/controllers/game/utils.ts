export const median = (data: number[]) => {
    return quartile50(data);
}

function quartile50(data: number[]) {
    return quartile(data, 0.5);
}

function quartile(data: number[], q: number) {
    data.sort((a, b) => {
        return a - b;
    });
    const pos = ((data.length) - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if ((data[ base + 1 ] !== undefined)) {
        return data[ base ] + rest * (data[ base + 1 ] - data[ base ]);
    } else {
        return data[ base ];
    }
}

export const countDown = (startTime:number, from:number, timeGap:number, callback: (i: number) => void) => {
    let interval: NodeJS.Timer;
    const timeout = setTimeout(() => {;
        callback(from);
        interval = setInterval(() => {
            from = from - 1;
            callback(from);
            if (from <= 0) {
                clearInterval(interval);
            }
        }, timeGap);
    }, startTime);
    return () => {
        clearTimeout(timeout);
        clearInterval(interval);
    }
}