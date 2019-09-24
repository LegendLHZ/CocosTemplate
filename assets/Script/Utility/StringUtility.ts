
export class StringUtility
{
    static Format(data: string, ...args: any[])
    {
        if (args.length == 0)
            return data;

        var str = data;
        for (var i = 0; i < args.length; i++)
        {
            var re = new RegExp('\\{' + i + '\\}');
            if (typeof (args[i]) == "object")
            {
                str = str.replace(re,JSON.stringify(args[i]));
            }
            else
            {
                str = str.replace(re, args[i]);
            }
        }
        return str;
    }
}