import { BindingManager } from "./BindingManager";

export enum ResetModel
{
    ResetTarget,
    ResetSource,
}

export class Binding
{
    public OnCollectionChange: (action: string, args: any[]) => void;
    public resetModel: ResetModel;

    private source: object;
    private sourcePath: string;
    private target: object;
    private targetPath: string;

    public get Source() : object
    {
        return this.source;
    }

    public get SourcePath() : string
    {
        return this.sourcePath;
    }

    public get IsBound() : boolean
    {
        return this.source != null;
    }

    constructor(_sourcePath, _target, _targetPath)
    {
        this.sourcePath = _sourcePath;
        this.target = _target;
        this.targetPath = _targetPath;

        this.resetModel = ResetModel.ResetTarget;
    }

    // 解析路径
    private FindNestObject(_object: object, path: string): {obj: object, path: string}
    {
        if(_object == null)
        {
            console.error("The object is null");
            return null;
        }

        if(path == null || path == "")
        {
            console.error("The path is empty.");
            return null;
        }

        let result = {
            obj: _object,
            path: path
        };

        let paths = path.split('.');
        if(paths.length >= 2)
        {
            for (let index = 0; index < paths.length - 1; index++)
            {
                const element = paths[index];
                result.obj = result.obj[element];
                if(result.obj == null)
                {
                    console.error("The path is error -> ", path);
                    return null;
                }
            }
            result.path = paths[paths.length - 1];
        }

        if(!(result.path in result.obj))
        {
            console.error("The path is error -> ", path);
            return null;
        }

        return result;
    }

    public UpdateTargetValue()
    {
        if (!this.IsBound)
        {
            console.error("Unbinded");
            return;
        }

        this.target[this.targetPath] = this.source[this.sourcePath];
    }

    public UpdateSourceValue()
    {
        if (!this.IsBound)
        {
            console.error("Unbinded");
            return;
        }

        this.source[this.sourcePath] = this.target[this.targetPath];
    }

    public Bind(source: object)
    {
        if(this.sourcePath == null || this.sourcePath == "")
        {
            console.error("Source path is invalid.");
            return;
        }

        if(this.targetPath == null || this.targetPath == "")
        {
            console.error("Target path is invalid.");
            return;
        }

        if(this.target == null)
        {
            console.error("Target is null.");
            return;
        }

        if(this.IsBound)
        {
            this.UnBind();
        }

        let result = this.FindNestObject(source, this.sourcePath);
        if(result == null)
        {
            return;
        }
        this.source = result.obj;
        this.sourcePath = result.path;

        result = this.FindNestObject(this.target, this.targetPath);
        if(result == null)
        {
            return;
        }
        this.target = result.obj;
        this.targetPath = result.path;

        // 建立绑定
        BindingManager.Instance.Bind(this);

        if(this.resetModel == ResetModel.ResetTarget)
        {
            this.UpdateTargetValue();
        }
        else
        {
            this.UpdateSourceValue();
        }
    }

    public UnBind()
    {
        if (!this.IsBound)
        {
            return;
        }

        // 解除绑定
        BindingManager.Instance.UnBind(this);
        
        this.source = null;
    }
}