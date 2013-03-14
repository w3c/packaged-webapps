function prefEquals(name, value, readonly)
{
    try
    {
        if (!widget) return;
        if (!widget.preferences) return;

        if (!widget.preferences[name])
        {
            fail("Test "+id+" failed because preference "+name+" does not exist");
            return;
        }
        if (widget.preferences[name] !== value)
        {
            fail("Test "+id+" failed because preference "+name+" does not equal "+value);
            return;
        }
        if (readonly !== null)
        {
            try
            {
                widget.preferences[name] = "random-value"
                if (readonly === true)
                {
                    fail("Test "+id+" failed because preference "+name+" is not readonly");
                    return;
                }
            }
            catch (e)
            {
                if(e.code === DOMException.NO_MODIFICATION_ALLOWED_ERR)
                {
                    if (readonly === false)
                    {
                        fail("Test "+id+" failed because preference "+name+" is readonly");
                        return;
                    }
                }
            }
        }

        pass("Test "+id+" passed");

    } catch (e) {
        fail("Test "+id+" failed because "+e.message);
    }
}

prefEquals("PASS", "PASS", false);
