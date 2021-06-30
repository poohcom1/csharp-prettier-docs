
// Contains 2 non-standard keys
public class TestDoc4 {
    /// <value>I don't even know the purpose of this tag</value>
    public string Test { get; set; }


    /// <typeparam name="T">The element type of the array</typeparam>
    public static T[] mkArray<T>(int n) {
        return new T[n];
    }
}