
export class RandomUtility
{
    // Generate a random array that is nonredundant.
    public static RandomList(min: number, max: number): Array<number>
    {
        if (min > max)
        {
            return [];
        }

        let list: Array<number> = [];

        for (let i = min; i <= max; i++)
        {
            list.push(i);
        }

        for (let i = 0; i < list.length; i++)
        {
            let swapIndex = (i + RandomUtility.Range(0, list.length)) % list.length;

            let temp = list[i];
            list[i] = list[swapIndex];
            list[swapIndex] = temp;
        }

        return list;
    }

    public static Range(Min: number, Max: number)
    {
        var Range = Max - Min;
        var Rand = Math.random();
        var num = Min + Math.floor(Rand * Range);
        return num;
    }

    public static RandomByWeight<T>(list: {value: T, weight: number}[]): T
    {
        if(list == null || list.length == 0)
        {
            return null;
        }

        if(list.length == 1)
        {
            return list[0].value;
        }

        let total = 0;
        for (let i = 0; i < list.length; i++)
        {
            const item = list[i];
            total += item.weight;
        }

        let random = RandomUtility.Range(1, total + 1);
        let currentWeight = 0;
        for (let i = 0; i < list.length; i++)
        {
            const item = list[i];
            currentWeight += item.weight;
            if(random <= currentWeight)
            {
                return item.value;
            }
        }
    }
}