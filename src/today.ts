export function today(): string {
    const today: Date = new Date();
    return `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
}

export function strToDate(day: string): Date {
    return new Date(day);
}