enum RemoteDataState {
    Loading = 0,
    Error = 1,
    Success = 2,
}

type RemoteDataNotAsked = null;

interface RemoteDataLoading {
    state: RemoteDataState.Loading;
}

interface RemoteDataError {
    state: RemoteDataState.Error;
    error: Error;
}

interface RemoteDataSuccess<SuccessT> {
    state: RemoteDataState.Success;
    value: SuccessT;
}

type RemoteData<SuccessT> =
    | RemoteDataNotAsked
    | RemoteDataLoading
    | RemoteDataError
    | RemoteDataSuccess<SuccessT>;

interface RemoteDataSwitchListExplicit<SuccessT, ReturnT> {
    notAsked: () => ReturnT;
    loading: () => ReturnT;
    error: (err: Error) => ReturnT;
    success: (value: SuccessT) => ReturnT;
}

interface RemoteDataSwitchListWithDefault<SuccessT, ReturnT> {
    notAsked?: () => ReturnT;
    loading?: () => ReturnT;
    error?: (err: Error) => ReturnT;
    success?: (value: SuccessT) => ReturnT;
    default: () => ReturnT;
}

type RemoteDataSwitchList<SuccessT, ReturnT> =
    | RemoteDataSwitchListExplicit<SuccessT, ReturnT>
    | RemoteDataSwitchListWithDefault<SuccessT, ReturnT>;

interface RemotePromiseOpts<SuccessT> {
    onLoading?: () => void;
    onError?: (err: Error) => void;
    onSuccess?: (value: SuccessT) => void;
}

function promise<SuccessT>(
    promise: Promise<SuccessT>,
    setValue: (result: RemoteData<SuccessT>) => void,
    opts?: RemotePromiseOpts<SuccessT>,
) {
    setValue({ state: RemoteDataState.Loading });
    opts?.onLoading?.call(null);
    promise
        .then((resp) => {
            setValue({ state: RemoteDataState.Success, value: resp });
            opts?.onSuccess?.call(null, resp);
        })
        .catch((err) => {
            if (err instanceof Error)
                setValue({ state: RemoteDataState.Error, error: err });
            else setValue({ state: RemoteDataState.Error, error: Error(err) });
            opts?.onError?.call(null, err);
        });
    return {
        state: RemoteDataState.Loading,
    };
}

function fold<ReturnT, SuccessT>(
    data: RemoteData<SuccessT>,
    cases: RemoteDataSwitchList<SuccessT, ReturnT>,
): ReturnT {
    if ("default" in cases) {
        if (data === null)
            return cases.notAsked ? cases.notAsked() : cases.default();
        switch (data.state) {
            case RemoteDataState.Loading:
                return cases.loading ? cases.loading() : cases.default();
            case RemoteDataState.Error:
                return cases.error ? cases.error(data.error) : cases.default();
            case RemoteDataState.Success:
                return cases.success
                    ? cases.success(data.value)
                    : cases.default();
        }
    } else {
        if (data === null) return cases.notAsked();
        switch (data.state) {
            case RemoteDataState.Loading:
                return cases.loading();
            case RemoteDataState.Error:
                return cases.error(data.error);
            case RemoteDataState.Success:
                return cases.success(data.value);
        }
    }
}

function must<SuccessT>(data: RemoteData<SuccessT>): SuccessT | undefined {
    if (data === null || data.state != RemoteDataState.Success)
        return undefined;
    return data.value;
}

function derive<ReturnT, SuccessT>(
    data: RemoteData<SuccessT>,
    fn: (value: SuccessT) => ReturnT,
): RemoteData<ReturnT> {
    return fold<RemoteData<ReturnT>, SuccessT>(data, {
        success: (d) => ({ state: RemoteDataState.Success, value: fn(d) }),
        notAsked: () => null,
        loading: () => ({ state: RemoteDataState.Loading }),
        error: (err) => ({ state: RemoteDataState.Error, error: err }),
    });
}

function apply<ReturnT, SuccessT>(
    data: RemoteData<SuccessT>,
    fn: (value: SuccessT) => ReturnT,
) {
    if (data === null || data.state != RemoteDataState.Success)
        return undefined;
    return fn(data.value);
}

function always<SuccessT>(value: SuccessT): RemoteData<SuccessT> {
    return {
        state: RemoteDataState.Success,
        value: value,
    };
}

function never<SuccessT>(err?: Error): RemoteData<SuccessT> {
    return {
        state: RemoteDataState.Error,
        error: err ?? Error(),
    };
}

export type { RemoteData };
export { promise, fold, must, derive, always, never, apply };
