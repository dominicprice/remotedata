import * as rd from "../src";

const simulateFetchMs = 1000;
const simulateFetch = () => new Promise((r) => setTimeout(r, simulateFetchMs));

async function getTestData(): Promise<number> {
    await simulateFetch();
    return 1;
}

async function getTestDataError(): Promise<number> {
    await simulateFetch();
    throw Error("test error");
}

test("test1", () => {
    let data: rd.RemoteData<number> = null;
    expect(
        rd.fold(data, {
            success: () => "success",
            error: () => "error",
            loading: () => "loading",
            notAsked: () => "notAsked",
        }),
    ).toBe("notAsked");
    expect(
        rd.fold(data, {
            success: () => "success",
            default: () => "default",
        }),
    ).toBe("default");

    rd.promise(getTestData(), (r) => (data = r));
    expect(
        rd.fold(data, {
            success: () => "success",
            error: () => "error",
            loading: () => "loading",
            notAsked: () => "notAsked",
        }),
    ).toBe("loading");
});
