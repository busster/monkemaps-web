export const chunkItems = <T>(items: T[], chunkSize?: number) =>
  items.reduce((chunks: T[][], item: T, index) => {
    const chunkSz = chunkSize ?? 50;
    const chunk = Math.floor(index / chunkSz);
    chunks[chunk] = ([] as T[]).concat(chunks[chunk] || [], item);
    return chunks;
  }, []);
