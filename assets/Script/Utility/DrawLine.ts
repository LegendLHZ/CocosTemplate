
export class DrawLine
{
    public static drawLine(start: cc.Vec2, end: cc.Vec2, ctx: cc.Graphics)
    {
        //获得从start到end的向量
        var line = end.sub(start)
        //获得这个向量的长度
        var lineLength = line.mag()
        //设置虚线中每条线段的长度
        var length = 10
        //根据每条线段的长度获得一个增量向量
        var increment = line.normalize().mul(length)
        //确定现在是画线还是留空的bool
        var drawingLine=true
        //临时变量
        var pos = start.clone()
        //只要线段长度还大于每条线段的长度
        for(; lineLength>length; lineLength-=length)
        {
            if(drawingLine)
            {
                //画线
                ctx.moveTo(pos.x,pos.y)
                pos.addSelf(increment)
                ctx.lineTo(pos.x,pos.y)
                ctx.stroke()
            }
            else
            {
                //留空
                pos.addSelf(increment)
            }
            //取反
            drawingLine = !drawingLine
        }
        //最后一段
        if(drawingLine)
        { 
            ctx.moveTo(pos.x, pos.y)
            ctx.lineTo(end.x, end.y)
            ctx.stroke()
        }
    }
}