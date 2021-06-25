
// Contains 1 summary, 2 params, and 1 return.
// Should include (2 summary * 2 [or 3 if blockPrefix exists]) + (3 param) + (2 return) = 9 decorators or 11
public class TestDoc2 {
    /// <summary>
    /// A test function
    /// </summary>
    /// <param name="test">A test int</param>
    /// <param name="testString">A test string></param>
    /// <returns>Test results
    ///  two lines</returns>
    public static int test(int test, string testString);

    /// <summary>
    /// A test function
    /// </summary>
    /// <param name="testString">A test string></param>
    public static void test2(int test, string testString);
}