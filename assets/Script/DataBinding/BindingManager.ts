import DataContext from "./DataContext";
import { Binding } from "./Binding";

const ArrayFunc = ['push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice'];

export class BindingManager
{
    private static instance: BindingManager;
    public static get Instance() : BindingManager
    {
        if(this.instance == null)
        {
            this.instance = new BindingManager();
        }
        return this.instance;
    }
    
    private dataContextDictionary: Array<{sourceName: string, contexts: Array<DataContext>}> = [];
    private sourceDictionary: Array<{sourceName: string, source: object}> = [];
    private bindingDictionary: Array<{nestSource: object, path: string, bindingList: Array<Binding>}> = [];

    private BindSource(sourceName: string)
    {
        // Find all contexts by source name.
        let result = this.dataContextDictionary.filter((item) => { return item.sourceName == sourceName; });
        if(result == null || result.length <= 0)
        {
            // No context need to bind.
            return;
        }

        let contextList: Array<DataContext> = result[0].contexts;

        // Get source.
        let sourceList = this.sourceDictionary.filter((item) => { return item.sourceName == sourceName; });
        if(sourceList == null || sourceList.length <= 0)
        {
            return;
        }

        // Set source.
        let source = sourceList[0].source;
        contextList.forEach(context => {
            context.SetSource(source); 
        });
    }

    private UnbindSource(sourceName: string)
    {
        // Find all contexts by source name.
        let result = this.dataContextDictionary.filter((item) => { return item.sourceName == sourceName; });
        if(result == null || result.length <= 0)
        {
            // No context need to unbind.
            return;
        }

        // Remove source.
        let contextList: Array<DataContext> = result[0].contexts;
        contextList.forEach(context => {
            context.RemoveSource(); 
        });
    }

    public AddDataContext(sourceName: string, dataContext: DataContext)
    {
        if(sourceName == null || dataContext == null)
        {
            console.error("Source name or data context is null.");
            return;
        }

        // Check if data context is added.
        let contextList: Array<DataContext>;
        for (let x = 0; x < this.dataContextDictionary.length; x++)
        {
            const element = this.dataContextDictionary[x];
            if(element.sourceName == sourceName)
            {
                contextList = element.contexts;
            }
            for (let y = 0; y < element.contexts.length; y++)
            {
                const context = element.contexts[y];
                if(context == dataContext)
                {
                    console.error("DataContext is already registered -> ", dataContext);
                    return;
                }
            }
        }

        // Add context to dictionary;
        if(contextList == null)
        {
            contextList = [];
            this.dataContextDictionary.push({ sourceName: sourceName, contexts: contextList });
        }
        contextList.push(dataContext);

        // Set source for context.
        let sourceList = this.sourceDictionary.filter((item) => { return item.sourceName == sourceName; });
        if(sourceList != null && sourceList.length > 0)
        {
            dataContext.SetSource(sourceList[0].source);
        }
    }

    public RemoveDataContext(dataContext: DataContext)
    {
        if (dataContext == null)
        {
            return;
        }

        // Find and remove data context.
        let sourceName: string;
        for (let x = 0; x < this.dataContextDictionary.length; x++)
        {
            const element = this.dataContextDictionary[x];
            let y;
            for (y = 0; y < element.contexts.length; y++)
            {
                const context = element.contexts[y];
                if(context == dataContext)
                {
                    sourceName = element.sourceName;
                    break;
                }
            }
            if(sourceName != null)
            {
                element.contexts.splice(y, 1);
                break;
            }
        }

        if(sourceName == null)
        {
            console.error("DataContext is unregistered -> ", dataContext);
            return;
        }

        dataContext.RemoveSource();
    }

    public AddSource(name: string, source: object)
    {
        if (name == null || source == null)
        {
            console.error("Source or source name is null.");
            return;
        }

        if (this.sourceDictionary.some((item) => { return name == item.sourceName; }))
        {
            console.error("Source is already added -> ", name);
            return;
        }

        this.sourceDictionary.push({ sourceName: name, source: source });
        this.BindSource(name);
    }

    public RemoveSource(source: object)
    {
        if(source == null)
        {
            return;
        }

        let result = this.sourceDictionary.filter((item) => { return item.source == source });
        if(result == null || result.length <= 0)
        {
            return;
        }

        let index = this.sourceDictionary.indexOf(result[0]);
        this.sourceDictionary.splice(index, 1);

        this.UnbindSource(result[0].sourceName);
    }

    public Bind(binding: Binding)
    {
        if(binding.Source == null || binding == null)
        {
            console.error("The nest source or binding is null.");
            return;
        }

        // 监听一个属性，如果已经监听过就添加到通知列表
        let result = this.bindingDictionary.filter((item) => { return item.nestSource == binding.Source && item.path == binding.SourcePath; });
        if(result == null || result.length == 0)
        {
            var bindingList: Array<Binding> = [];
            bindingList.push(binding);
            this.bindingDictionary.push({ nestSource: binding.Source, path: binding.SourcePath, bindingList: bindingList });

            // 建立绑定
            var _value = binding.Source[binding.SourcePath];
            Object.defineProperty(binding.Source, binding.SourcePath, {
                get: function ()
                {
                    return _value;
                },
                set: function (newValue)
                {
                    if (newValue != _value)
                    {
                        _value = newValue;
                        bindingList.forEach(element => {
                            element.UpdateTargetValue();
                        });
                    }
                }
            });

            // 监听数组
            if (_value instanceof Array)
            {
                var arrayProto = Array.prototype;
                var newProto = Object.create(arrayProto);

                // 已实现绑定的方法：['push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice']
                ArrayFunc.forEach(func => {
                    Object.defineProperty(newProto, func, {
                        value: function ()
                        {
                            var lastItem = null;
                            if(this.length > 0)
                            {
                                lastItem = this[this.length - 1];
                            }
                            var firstItem = null;
                            if(this.length > 0)
                            {
                                firstItem = this[0];
                            }

                            // 调用原始原型上的方法
                            let result = arrayProto[func].apply(this, arguments);
                            
                            // 通知binding
                            var args = new Array();
                            for (let i = 0; i < arguments.length; i++)
                            {
                                args.push(arguments[i]);
                            }
                            bindingList.forEach(element => {
                                if(func == "pop" && lastItem != null)
                                {
                                    args.push(lastItem);
                                }
                                if(func == "shift")
                                {
                                    args.push(firstItem);
                                }
                                if(func == "splice")
                                {
                                    args = result;
                                }
                                element.OnCollectionChange(func, args);
                            });

                            return result;
                        }
                    });
                });

                _value['__proto__'] = newProto;
            }
        }
        else
        {
            // 已监听，添加到通知列表
            result[0].bindingList.push(binding);
        }
    }

    public UnBind(binding: Binding)
    {
        if(binding == null)
        {
            return;
        }

        let result = this.bindingDictionary.filter((item) => { return item.nestSource == binding.Source && item.path == binding.SourcePath; });
        if(result != null && result.length != 0)
        {
            let item = result[0];
            let index = item.bindingList.indexOf(binding);
            if(index >= 0)
            {
                // 从通知列表移除
                item.bindingList.splice(index, 1);
                if(item.bindingList.length == 0)
                {
                    // 通知列表为空时移除监听
                    let _value = item.nestSource[item.path];
                    delete item.nestSource[item.path];
                    item.nestSource[item.path] = _value;

                    let i = this.bindingDictionary.indexOf(item);
                    this.bindingDictionary.splice(i, 1);
                }
            }
        }
    }

    public static AddBinding(binding: Binding, node: cc.Node): DataContext
    {
        if (node == null)
        {
            console.error("The node is null");
            return;
        }

        var context = this.FindDataContext(node);
        if (context == null)
        {
            console.error("Can not find data context")
            return;
        }
        context.AddBinding(binding);
        return context;
    }

    public static AddBindings(bindingList: Array<Binding>, node: cc.Node): DataContext
    {
        if (node == null)
        {
            console.error("The node is null");
            return;
        }

        var context = this.FindDataContext(node);
        if (context == null)
        {
            console.error("Can not find data context")
            return;
        }

        bindingList.forEach(element => {
            context.AddBinding(element);
        });
        return context;
    }

    public static FindDataContext(current: cc.Node): DataContext
    {
        var result: DataContext = null;

        while (current != null)
        {
            result = current.getComponent(DataContext);
            if (result != null)
            {
                break;
            }

            current = current.getParent();
        }

        return result;
    }
}